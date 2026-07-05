import type { ExportConversation } from "../queries";

/** Builds a JSON export: an array of conversations, each with its full message list. */
export function buildConversationsJson(conversations: ExportConversation[]): string {
  return JSON.stringify(conversations, null, 2);
}

const CSV_HEADER = [
  "conversation_id",
  "conversation_title",
  "agent_name",
  "message_id",
  "role",
  "timestamp",
  "response_time_ms",
  "content",
  "metadata",
];

/** Escapes a value for CSV: quotes (and doubles inner quotes) only when needed. */
function csvEscape(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

/**
 * Builds a CSV export: one row per message, per PRD ("Store and display
 * role, timestamp, agent, response time, and metadata per message").
 */
export function buildConversationsCsv(conversations: ExportConversation[]): string {
  const rows = conversations.flatMap((conversation) =>
    conversation.messages.map((message) => [
      conversation.id,
      conversation.title ?? "",
      conversation.agentName ?? "",
      message.id,
      message.role,
      message.created_at,
      message.response_time_ms?.toString() ?? "",
      message.content,
      JSON.stringify(message.metadata ?? {}),
    ]),
  );

  return [CSV_HEADER, ...rows].map((row) => row.map(csvEscape).join(",")).join("\r\n");
}
