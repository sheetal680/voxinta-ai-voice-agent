import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, MessagesSquare } from "lucide-react";

import { EmptyState } from "@/app/(dashboard)/_components/empty-state";
import { AdminConversationRow } from "@/features/admin/components/admin-conversation-row";
import { getAdminConversations } from "@/features/admin/queries";

export const metadata: Metadata = { title: "Conversation Logs — Voxinta" };
export const dynamic = "force-dynamic";

const RESULT_LIMIT = 100;

export default async function AdminConversationsPage() {
  const conversations = await getAdminConversations(RESULT_LIMIT);

  return (
    <>
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/admin"
          className="text-muted-foreground transition-colors hover:text-foreground"
          aria-label="Back to admin"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Conversation Logs</h1>
          <p className="text-sm text-muted-foreground">
            Most recent {conversations.length} conversations across every user.
          </p>
        </div>
      </div>

      {conversations.length === 0 ? (
        <EmptyState
          icon={MessagesSquare}
          title="No conversations yet"
          description="Conversations from every user will show up here once agents start talking to people."
        />
      ) : (
        <div className="flex flex-col gap-2">
          {conversations.map((conversation) => (
            <AdminConversationRow key={conversation.id} conversation={conversation} />
          ))}
        </div>
      )}
    </>
  );
}
