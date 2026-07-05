import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getLLMProvider } from "@/services/llm";
import type { LLMMessage, LLMRole } from "@/types";
import { getAgent } from "@/features/agents/queries";
import { buildSystemPrompt } from "@/features/chat/prompt";
import { chatRequestSchema } from "@/features/chat/schemas";
import { retrieveContext } from "@/features/knowledge/retrieval";

/**
 * POST /api/chat — sends a message (or regenerates the last response) and
 * streams the assistant's reply back as plain text.
 *
 * A Route Handler rather than a Server Action: streaming an incremental
 * response to the client is exactly what Route Handlers are for (a Server
 * Action's return value isn't designed for progressive reads the way a
 * `fetch()` + `ReadableStream` reader loop is on the client). Mutations
 * that don't need streaming (creating a conversation) stay Server Actions —
 * see features/chat/actions.ts.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ success: false, message: "You must be signed in." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = chatRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, message: parsed.error.issues[0]?.message ?? "Invalid request." },
      { status: 400 },
    );
  }

  const { conversationId } = parsed.data;

  const { data: conversation } = await supabase
    .from("conversations")
    .select("id, agent_id")
    .eq("id", conversationId)
    .eq("owner_id", user.id)
    .maybeSingle();

  if (!conversation) {
    return NextResponse.json({ success: false, message: "Conversation not found." }, { status: 404 });
  }

  const agent = conversation.agent_id ? await getAgent(conversation.agent_id) : null;

  if (parsed.data.type === "regenerate") {
    const { data: recent } = await supabase
      .from("messages")
      .select("id, role")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: false })
      .limit(2);
    const [last, secondLast] = recent ?? [];

    if (!last || last.role !== "assistant" || !secondLast || secondLast.role !== "user") {
      return NextResponse.json({ success: false, message: "Nothing to regenerate." }, { status: 400 });
    }

    await supabase.from("messages").delete().eq("id", last.id);
  } else {
    const { error: insertError } = await supabase.from("messages").insert({
      conversation_id: conversationId,
      agent_id: agent?.id ?? null,
      role: "user",
      content: parsed.data.content,
    });
    if (insertError) {
      return NextResponse.json({ success: false, message: insertError.message }, { status: 500 });
    }
  }

  const { data: history } = await supabase
    .from("messages")
    .select("role, content")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  // Retrieve knowledge-base context for this turn using the most recent
  // user message as the query — works for both a fresh message and a
  // regenerate (which has no new content of its own to embed).
  const lastUserMessage = [...(history ?? [])].reverse().find((message) => message.role === "user");
  const context = agent && lastUserMessage
    ? await retrieveContext(supabase, agent.id, lastUserMessage.content)
    : [];

  const llmMessages: LLMMessage[] = [
    { role: "system", content: buildSystemPrompt(agent, context) },
    ...(history ?? []).map((message) => ({
      role: message.role as LLMRole,
      content: message.content,
    })),
  ];

  const provider = getLLMProvider();
  const startedAt = Date.now();
  const encoder = new TextEncoder();
  let accumulated = "";

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const chunk of provider.streamGenerate({
          messages: llmMessages,
          temperature: agent?.temperature,
          maxTokens: agent?.max_tokens,
          signal: request.signal,
        })) {
          if (chunk.delta) {
            accumulated += chunk.delta;
            controller.enqueue(encoder.encode(chunk.delta));
          }
        }
      } catch (error) {
        const aborted = error instanceof Error && error.name === "AbortError";
        if (!aborted) {
          console.error("[chat] streamGenerate failed:", error);
        }
      } finally {
        controller.close();

        if (accumulated.trim()) {
          const { error: assistantInsertError } = await supabase.from("messages").insert({
            conversation_id: conversationId,
            agent_id: agent?.id ?? null,
            role: "assistant",
            content: accumulated,
            response_time_ms: Date.now() - startedAt,
          });
          if (assistantInsertError) {
            console.error("[chat] failed to persist assistant reply:", assistantInsertError.message);
          }
        }
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
