import Link from "next/link";
import { MessagesSquare } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { ConversationListItem } from "../queries";
import { DeleteConversationDialog } from "./delete-conversation-dialog";
import { ExportLinks } from "./export-links";
import { formatDateTime, formatResponseTime } from "../lib/format";

function initialsFrom(name: string): string {
  return name.trim().slice(0, 2).toUpperCase() || "AI";
}

export function ConversationRow({ conversation }: { conversation: ConversationListItem }) {
  const title = conversation.title || conversation.agentName || "Conversation";

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border/50 bg-card/60 px-3 py-2.5">
      <Avatar size="sm" className="shrink-0">
        <AvatarFallback>
          {conversation.agentName ? initialsFrom(conversation.agentName) : "AI"}
        </AvatarFallback>
      </Avatar>

      <Link href={`/dashboard/conversations/${conversation.id}`} className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{title}</p>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
          {conversation.agentName && (
            <>
              <span>{conversation.agentName}</span>
              <span aria-hidden>·</span>
            </>
          )}
          <span className="flex items-center gap-1">
            <MessagesSquare className="size-3" />
            {conversation.messageCount}
          </span>
          <span aria-hidden>·</span>
          <span>{formatDateTime(conversation.updatedAt)}</span>
        </div>
        {conversation.lastMessagePreview && (
          <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
            {conversation.lastMessagePreview}
          </p>
        )}
      </Link>

      <Badge variant="secondary" className="shrink-0">
        {formatResponseTime(conversation.avgResponseTimeMs)}
      </Badge>

      <ExportLinks queryString={`ids=${conversation.id}`} />

      <DeleteConversationDialog conversationId={conversation.id} title={title} />
    </div>
  );
}
