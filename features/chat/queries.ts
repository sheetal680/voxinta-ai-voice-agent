import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Conversation, Message } from "@/types/database";

/**
 * Read-side data access for chat. Plain async functions (not Server
 * Actions) — called directly from Server Components. RLS scopes
 * conversations to their owner and messages to their parent conversation's
 * owner, so no explicit filter is needed beyond the id lookup itself.
 */

export interface ConversationListFilters {
  agentId?: string;
  /** Free-text match against the conversation title or any message's content. */
  search?: string;
  /** Inclusive lower bound on `created_at`, e.g. "2026-07-01". */
  fromDate?: string;
  /** Inclusive upper bound on `created_at`, e.g. "2026-07-05". */
  toDate?: string;
}

export interface ConversationListItem {
  id: string;
  title: string | null;
  agentId: string | null;
  agentName: string | null;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
  lastMessageAt: string | null;
  lastMessagePreview: string | null;
  avgResponseTimeMs: number | null;
}

/**
 * Conversations for the Conversations dashboard view, with per-conversation
 * stats (message count, last activity, average response time) computed in
 * SQL via `list_conversations_with_stats` — a JS-side aggregate would mean
 * fetching every message for every conversation just to count/average them.
 */
export const listConversations = cache(
  async (filters: ConversationListFilters = {}): Promise<ConversationListItem[]> => {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("list_conversations_with_stats", {
      filter_agent_id: filters.agentId || undefined,
      filter_search: filters.search || undefined,
      // Widen a "YYYY-MM-DD" bound to the full day in UTC — otherwise "to
      // date" would cut off at midnight and exclude that entire day.
      filter_from: filters.fromDate ? `${filters.fromDate}T00:00:00.000Z` : undefined,
      filter_to: filters.toDate ? `${filters.toDate}T23:59:59.999Z` : undefined,
    });

    if (error) {
      console.error("[chat] listConversations failed:", error.message);
      return [];
    }

    return data.map((row) => ({
      id: row.id,
      title: row.title,
      agentId: row.agent_id,
      agentName: row.agent_name,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      messageCount: Number(row.message_count),
      lastMessageAt: row.last_message_at,
      lastMessagePreview: row.last_message_preview,
      avgResponseTimeMs: row.avg_response_time_ms === null ? null : Number(row.avg_response_time_ms),
    }));
  },
);

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

export interface ExportConversation {
  id: string;
  title: string | null;
  agentName: string | null;
  createdAt: string;
  messages: Message[];
}

/**
 * Conversations plus their full message list, shaped for export (JSON/CSV).
 * Not `cache()`-wrapped — export is a one-off action, not repeated within a
 * render, and the id set varies per call.
 */
export async function getConversationsForExport(conversationIds: string[]): Promise<ExportConversation[]> {
  if (conversationIds.length === 0) return [];

  const supabase = await createClient();
  const { data: conversations, error } = await supabase
    .from("conversations")
    .select("id, title, created_at, agents(name)")
    .in("id", conversationIds);

  if (error || !conversations) {
    console.error("[chat] getConversationsForExport failed:", error?.message);
    return [];
  }

  const results: ExportConversation[] = [];
  for (const conversation of conversations) {
    const messages = await getMessages(conversation.id);
    results.push({
      id: conversation.id,
      title: conversation.title,
      agentName: conversation.agents?.name ?? null,
      createdAt: conversation.created_at,
      messages,
    });
  }
  return results;
}
