import type { Metadata } from "next";
import { MessagesSquare } from "lucide-react";

import { ConversationFilters } from "@/features/chat/components/conversation-filters";
import { ConversationRow } from "@/features/chat/components/conversation-row";
import { ExportLinks } from "@/features/chat/components/export-links";
import { listConversations } from "@/features/chat/queries";
import { getAgents } from "@/features/agents/queries";
import { EmptyState } from "../../_components/empty-state";

export const metadata: Metadata = { title: "Conversations — Voxinta" };

// Depends on the caller's cookie-scoped auth session and searchParams —
// must never be statically prerendered.
export const dynamic = "force-dynamic";

export default async function ConversationsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; agent?: string; from?: string; to?: string }>;
}) {
  const params = await searchParams;

  const [agents, conversations] = await Promise.all([
    getAgents(),
    listConversations({
      agentId: params.agent,
      search: params.q,
      fromDate: params.from,
      toDate: params.to,
    }),
  ]);

  const exportQuery = new URLSearchParams();
  if (params.agent) exportQuery.set("agentId", params.agent);
  if (params.q) exportQuery.set("search", params.q);
  if (params.from) exportQuery.set("from", params.from);
  if (params.to) exportQuery.set("to", params.to);

  const hasAnyConversations = conversations.length > 0 || Boolean(params.q || params.agent || params.from || params.to);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Conversations</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Search, filter, and review every conversation your agents have had.
          </p>
        </div>
        {conversations.length > 0 && <ExportLinks queryString={exportQuery.toString()} />}
      </div>

      <ConversationFilters agents={agents} />

      {conversations.length === 0 ? (
        <EmptyState
          icon={MessagesSquare}
          title={hasAnyConversations ? "No matching conversations" : "No conversations yet"}
          description={
            hasAnyConversations
              ? "Try a different search term, agent, or date range."
              : "Once your agents start talking with users, conversations will show up here."
          }
        />
      ) : (
        <div className="flex flex-col gap-2">
          {conversations.map((conversation) => (
            <ConversationRow key={conversation.id} conversation={conversation} />
          ))}
        </div>
      )}
    </div>
  );
}
