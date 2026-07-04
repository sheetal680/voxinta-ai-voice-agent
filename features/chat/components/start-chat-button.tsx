"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MessageSquarePlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { createConversation } from "../actions";

export function StartChatButton({ agentId }: { agentId: string }) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string>();

  async function handleClick() {
    setError(undefined);
    setIsPending(true);
    try {
      const result = await createConversation(agentId);
      if (!result.success || !result.data) {
        setError(result.message ?? "Failed to start a conversation.");
        setIsPending(false);
        return;
      }
      router.push(`/dashboard/conversations/${result.data.conversationId}`);
    } catch {
      setError("Something went wrong. Please try again.");
      setIsPending(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button type="button" onClick={handleClick} disabled={isPending}>
        <MessageSquarePlus /> {isPending ? "Starting…" : "Chat with agent"}
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
