"use client";

import { useState } from "react";
import { Check, Copy, RotateCcw } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatDateTime, formatResponseTime } from "../lib/format";
import { MarkdownContent } from "./markdown-content";

export interface ChatMessageItem {
  id: string;
  role: "user" | "assistant";
  content: string;
  /**
   * Present for messages loaded from history (the Conversations detail
   * view); absent for a message still in flight in the current session, so
   * the per-message metadata footer below simply doesn't render for those.
   */
  createdAt?: string;
  responseTimeMs?: number | null;
}

function initialsFrom(name: string): string {
  return name.trim().slice(0, 2).toUpperCase() || "AI";
}

export function MessageBubble({
  message,
  agentName,
  agentAvatarUrl,
  showRegenerate,
  onRegenerate,
}: {
  message: ChatMessageItem;
  agentName: string;
  agentAvatarUrl?: string | null;
  showRegenerate?: boolean;
  onRegenerate?: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === "user";

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (error) {
      // Clipboard access can fail (permissions, insecure context, browser
      // policy) — leave the icon as "Copy" rather than falsely showing success.
      console.error("[chat] failed to copy message:", error);
    }
  }

  return (
    <div className={cn("flex items-start gap-3", isUser && "flex-row-reverse")}>
      <Avatar size="sm" className="mt-1 shrink-0">
        {!isUser && <AvatarImage src={agentAvatarUrl ?? undefined} alt="" />}
        <AvatarFallback>{isUser ? "You" : initialsFrom(agentName)}</AvatarFallback>
      </Avatar>

      <div className={cn("flex min-w-0 max-w-[80%] flex-col gap-1", isUser && "items-end")}>
        <div
          className={cn(
            "rounded-2xl px-4 py-2.5 text-sm",
            isUser
              ? "rounded-tr-sm bg-primary text-primary-foreground"
              : "rounded-tl-sm bg-muted text-foreground",
          )}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <MarkdownContent content={message.content} />
          )}
        </div>

        <div className="flex items-center gap-1 px-1">
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={handleCopy}
            aria-label="Copy message"
          >
            {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
          </Button>
          {showRegenerate && (
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={onRegenerate}
              aria-label="Regenerate response"
            >
              <RotateCcw className="size-3" />
            </Button>
          )}
          {message.createdAt && (
            <span className="flex items-center gap-1 text-[0.7rem] text-muted-foreground">
              {formatDateTime(message.createdAt)}
              {!isUser && message.responseTimeMs != null && (
                <Badge variant="outline" className="h-4 px-1 text-[0.65rem]">
                  {formatResponseTime(message.responseTimeMs)}
                </Badge>
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
