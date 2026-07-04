"use client";

import { useEffect, useRef } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MarkdownContent } from "./markdown-content";
import { MessageBubble, type ChatMessageItem } from "./message-bubble";
import { TypingIndicator } from "./typing-indicator";

function initialsFrom(name: string): string {
  return name.trim().slice(0, 2).toUpperCase() || "AI";
}

export function MessageList({
  messages,
  agentName,
  agentAvatarUrl,
  streamingContent,
  isStreaming,
  onRegenerate,
}: {
  messages: ChatMessageItem[];
  agentName: string;
  agentAvatarUrl?: string | null;
  streamingContent: string;
  isStreaming: boolean;
  onRegenerate: () => void;
}) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, streamingContent, isStreaming]);

  const lastMessage = messages[messages.length - 1];
  const canRegenerateLast = !isStreaming && lastMessage?.role === "assistant";

  return (
    <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-6 sm:px-6">
      {messages.map((message) => (
        <MessageBubble
          key={message.id}
          message={message}
          agentName={agentName}
          agentAvatarUrl={agentAvatarUrl}
          showRegenerate={canRegenerateLast && message.id === lastMessage.id}
          onRegenerate={onRegenerate}
        />
      ))}

      {isStreaming && (
        <div className="flex items-start gap-3">
          <Avatar size="sm" className="mt-1 shrink-0">
            <AvatarImage src={agentAvatarUrl ?? undefined} alt="" />
            <AvatarFallback>{initialsFrom(agentName)}</AvatarFallback>
          </Avatar>
          {streamingContent ? (
            <div className="max-w-[80%] rounded-2xl rounded-tl-sm bg-muted px-4 py-2.5 text-sm">
              <MarkdownContent content={streamingContent} />
            </div>
          ) : (
            <TypingIndicator />
          )}
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
