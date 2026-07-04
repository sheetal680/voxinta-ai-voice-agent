import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Conversation, Message } from "@/types/database";

/**
 * Read-side data access for chat. Plain async functions (not Server
 * Actions) — called directly from Server Components. RLS scopes
 * conversations to their owner and messages to their parent conversation's
 * owner, so no explicit filter is needed beyond the id lookup itself.
 */

export const getConversation = cache(async (id: string): Promise<Conversation | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("conversations")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("[chat] getConversation failed:", error.message);
    return null;
  }

  return data;
});

export const getMessages = cache(async (conversationId: string): Promise<Message[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[chat] getMessages failed:", error.message);
    return [];
  }

  return data;
});
