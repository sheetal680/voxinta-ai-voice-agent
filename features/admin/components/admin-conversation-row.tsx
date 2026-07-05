import Link from "next/link";
import { MessagesSquare } from "lucide-react";

import { formatDateTime } from "@/features/chat/lib/format";
import type { AdminConversationSummary } from "../queries";

export function AdminConversationRow({ conversation }: { conversation: AdminConversationSummary }) {
  const title = conversation.title || conversation.agentName || "Conversation";

  return (
    <Link
      href={`/dashboard/conversations/${conversation.id}`}
      className="flex items-center gap-3 rounded-lg border border-border/50 bg-card/60 px-3 py-2.5 transition-colors hover:bg-muted/50"
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{title}</p>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
          <span>{conversation.ownerEmail ?? "Unknown owner"}</span>
          {conversation.agentName && (
            <>
              <span aria-hidden>·</span>
              <span>{conversation.agentName}</span>
            </>
          )}
          <span aria-hidden>·</span>
          <span className="flex items-center gap-1">
            <MessagesSquare className="size-3" />
            {conversation.messageCount}
          </span>
        </div>
      </div>
      <span className="shrink-0 text-xs text-muted-foreground">
        {formatDateTime(conversation.updatedAt)}
      </span>
    </Link>
  );
}
