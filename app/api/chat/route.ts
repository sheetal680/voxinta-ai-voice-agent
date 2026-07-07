import { NextResponse, type NextRequest } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import { getLLMProvider, runWithTools } from "@/services/llm";
import type { LLMMessage, LLMRole } from "@/types";
import type { Database, Json } from "@/types/database";
import { getAgent } from "@/features/agents/queries";
import { buildSystemPrompt } from "@/features/chat/prompt";
import { chatRequestSchema } from "@/features/chat/schemas";
import { getEnabledToolDefinitionsForAgent } from "@/features/integrations/queries";
import { retrieveContext } from "@/features/knowledge/retrieval";

/**
 * Edge Runtime: this route's whole dependency chain is fetch-based (Supabase
 * JS, Groq via global fetch, the calculator/weather/web-search tools) with
 * no Node-only APIs — confirmed by grepping for `node:` imports and Buffer
 * usage before flipping this on. A streaming chat reply is exactly the
 * latency-sensitive, globally-distributed workload Edge is for. If a future
 * tool or provider needs a Node-only package (e.g. an SDK requiring
 * node:crypto, like services/shared/encryption.ts already does elsewhere),
 * this must come back off Edge.
 */
export const runtime = "edge";

/**
 * Persists a tool-calling round's intermediate message (an assistant
 * tool-call request, or a tool's result) so the full transcript survives a
 * page refresh. `toolCalls`/`toolCallId`/`name` have no dedicated columns —
 * they're minor, provider-shaped detail, so they ride in `metadata` rather
 * than widening the `messages` table for this one feature.
 */
async function persistIntermediateMessage(
  supabase: SupabaseClient<Database>,
  conversationId: string,
  agentId: string | null,
  message: LLMMessage,
) {
  const { error } = await supabase.from("messages").insert({
    conversation_id: conversationId,
    agent_id: agentId,
    role: message.role,
    content: message.content,
    metadata: (message.toolCalls
      ? { toolCalls: message.toolCalls }
      : message.toolCallId
        ? { toolCallId: message.toolCallId, toolName: message.name }
        : {}) as Json,
  });
  if (error) {
    logger.error("chat", "Failed to persist intermediate message", error);
  }
}

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
  try {
    return await handleChatRequest(request);
  } catch (error) {
    // Anything unexpected before the stream starts (e.g. createClient()
    // throwing when Supabase env vars are missing) would otherwise crash
    // with a generic, non-JSON 500 — this keeps the response shape
    // consistent with every other failure path in this route.
    logger.error("chat", "Unexpected failure handling chat request", error);
    return NextResponse.json(
      { success: false, message: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}

async function handleChatRequest(request: NextRequest): Promise<Response> {
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

  // Messages a regenerate is replacing — computed now, but deliberately not
  // deleted until a new reply has actually been generated (see the stream's
  // `finally` below). Deleting up front and generating after left a window
  // where the conversation had no assistant reply at all: if generation
  // failed, or a second overlapping regenerate request read the table
  // mid-way through that window, it would see the last message as "user"
  // and wrongly report "Nothing to regenerate" — even though the first
  // request's generation was still in flight. Deferring the delete means a
  // failed generation leaves the old reply untouched (no data loss), and a
  // second concurrent request computes the same replacement set from the
  // same still-intact rows instead of racing against a partial delete.
  let idsToDelete: string[] = [];

  if (parsed.data.type === "regenerate") {
    // A tool-calling turn leaves several messages after the last user
    // message (an assistant tool-call request, tool results, possibly
    // repeated over a few rounds) — not just one. Regenerating means
    // replacing everything after that last user message, not just the most
    // recent row.
    const { data: recent } = await supabase
      .from("messages")
      .select("id, role")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: false })
      .limit(50);
    const messages = recent ?? [];
    const lastUserIndex = messages.findIndex((message) => message.role === "user");

    if (messages.length === 0 || messages[0].role !== "assistant" || lastUserIndex === -1) {
      return NextResponse.json({ success: false, message: "Nothing to regenerate." }, { status: 400 });
    }

    idsToDelete = messages.slice(0, lastUserIndex).map((message) => message.id);
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

  const { data: historyRows } = await supabase
    .from("messages")
    .select("id, role, content, metadata")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  // The rows a regenerate will replace are still in the table at this point
  // (see above) — excluded here so the model doesn't see the reply it's
  // about to be asked to redo.
  const excludeIds = new Set(idsToDelete);
  const history = (historyRows ?? []).filter((message) => !excludeIds.has(message.id));

  // Retrieve knowledge-base context for this turn using the most recent
  // user message as the query — works for both a fresh message and a
  // regenerate (which has no new content of its own to embed).
  const lastUserMessage = [...history].reverse().find((message) => message.role === "user");
  const context = agent && lastUserMessage
    ? await retrieveContext(supabase, agent.id, lastUserMessage.content)
    : [];

  const llmMessages: LLMMessage[] = [
    { role: "system", content: buildSystemPrompt(agent, context) },
    // Tool-call requests/results carry provider-shaped detail (toolCalls,
    // toolCallId) that has no dedicated column — it's round-tripped through
    // `metadata` here so a later turn's history stays a valid tool-calling
    // transcript (the API rejects a `tool` message not preceded by the
    // assistant message that requested it).
    ...history.map((message) => {
      const metadata = (message.metadata ?? {}) as {
        toolCalls?: LLMMessage["toolCalls"];
        toolCallId?: string;
        toolName?: string;
      };
      return {
        role: message.role as LLMRole,
        content: message.content,
        ...(metadata.toolCalls ? { toolCalls: metadata.toolCalls } : {}),
        ...(metadata.toolCallId ? { toolCallId: metadata.toolCallId, name: metadata.toolName } : {}),
      };
    }),
  ];

  // Tools are agent-scoped (see /dashboard/integrations): an agent-less
  // conversation gets none, rather than falling back to runWithTools' own
  // default of every registered tool.
  const enabledTools = agent ? await getEnabledToolDefinitionsForAgent(agent.id) : [];

  const provider = getLLMProvider();
  const startedAt = Date.now();
  const encoder = new TextEncoder();
  let accumulated = "";

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const chunk of runWithTools(provider, {
          messages: llmMessages,
          temperature: agent?.temperature,
          maxTokens: agent?.max_tokens,
          tools: enabledTools,
          signal: request.signal,
          onIntermediateMessage: (message) =>
            persistIntermediateMessage(supabase, conversationId, agent?.id ?? null, message),
        })) {
          if (chunk.delta) {
            accumulated += chunk.delta;
            controller.enqueue(encoder.encode(chunk.delta));
          }
        }
      } catch (error) {
        const aborted = error instanceof Error && error.name === "AbortError";
        if (!aborted) {
          logger.error("chat", "streamGenerate failed", error, { conversationId });
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
            logger.error("chat", "Failed to persist assistant reply", assistantInsertError, {
              conversationId,
            });
          } else if (idsToDelete.length > 0) {
            // Only now — the new reply is safely persisted — remove what
            // it's replacing. If this insert had failed above, idsToDelete
            // is left alone, so a failed regenerate never loses the old
            // reply without a replacement.
            const { error: deleteError } = await supabase
              .from("messages")
              .delete()
              .in("id", idsToDelete);
            if (deleteError) {
              logger.error("chat", "Failed to remove replaced messages after regenerate", deleteError, {
                conversationId,
              });
            }
          }
        }
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
