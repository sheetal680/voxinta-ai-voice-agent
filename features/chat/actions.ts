"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { idSchema, type ActionResult } from "@/lib/action-result";
import { logger } from "@/lib/logger";
import { getAgent } from "@/features/agents/queries";

/**
 * Creates a new conversation for an agent and returns its id so the caller
 * can navigate to it. If the agent has a welcome message configured, it's
 * inserted as the conversation's first (assistant) message.
 */
export async function createConversation(
  agentId: string,
): Promise<ActionResult<{ conversationId: string }>> {
  if (!idSchema.safeParse(agentId).success) {
    return { success: false, message: "Invalid agent id." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, message: "You must be signed in." };
  }

  // RLS already scopes this to the caller's own agents; getAgent returning
  // null here means either it doesn't exist or isn't owned by this user.
  const agent = await getAgent(agentId);
  if (!agent) {
    return { success: false, message: "Agent not found." };
  }

  const { data: conversation, error } = await supabase
    .from("conversations")
    .insert({ owner_id: user.id, agent_id: agent.id, title: agent.name })
    .select("id")
    .single();

  if (error) {
    return { success: false, message: error.message };
  }

  if (agent.welcome_message) {
    const { error: welcomeError } = await supabase.from("messages").insert({
      conversation_id: conversation.id,
      agent_id: agent.id,
      role: "assistant",
      content: agent.welcome_message,
    });
    if (welcomeError) {
      // Non-fatal — the conversation itself was created successfully.
      logger.error("chat", "Failed to insert welcome message", welcomeError);
    }
  }

  return { success: true, data: { conversationId: conversation.id } };
}

/**
 * Deletes a conversation (and, via `on delete cascade`, its messages). RLS
 * already scopes the delete to the caller's own conversations; the
 * `owner_id` filter here just makes that explicit rather than relying on
 * RLS alone to report "not found" for someone else's conversation.
 */
export async function deleteConversation(conversationId: string): Promise<ActionResult> {
  if (!idSchema.safeParse(conversationId).success) {
    return { success: false, message: "Invalid conversation id." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, message: "You must be signed in." };
  }

  const { error, count } = await supabase
    .from("conversations")
    .delete({ count: "exact" })
    .eq("id", conversationId)
    .eq("owner_id", user.id);

  if (error) {
    return { success: false, message: error.message };
  }
  if (!count) {
    return { success: false, message: "Conversation not found." };
  }

  revalidatePath("/dashboard/conversations");
  return { success: true };
}
