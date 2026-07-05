"use client";

import { useState } from "react";
import { ArrowUp, Square } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function ChatComposer({
  onSend,
  onStop,
  isStreaming,
  leadingSlot,
}: {
  onSend: (content: string) => void;
  onStop: () => void;
  isStreaming: boolean;
  /** Extra control rendered before the textarea (e.g. a mic button). */
  leadingSlot?: React.ReactNode;
}) {
  const [value, setValue] = useState("");

  function handleSend() {
    const trimmed = value.trim();
    if (!trimmed || isStreaming) return;
    onSend(trimmed);
    setValue("");
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="flex items-end gap-2 border-t border-border/50 bg-background/70 p-4 backdrop-blur-lg">
      {leadingSlot}
      <Textarea
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Message this agent…"
        rows={1}
        disabled={isStreaming}
        className="max-h-40 min-h-9 flex-1 resize-none"
      />
      {isStreaming ? (
        <Button type="button" variant="outline" size="icon" onClick={onStop} aria-label="Stop generating">
          <Square className="size-3.5 fill-current" />
        </Button>
      ) : (
        <Button
          type="button"
          size="icon"
          onClick={handleSend}
          disabled={!value.trim()}
          aria-label="Send message"
        >
          <ArrowUp />
        </Button>
      )}
    </div>
  );
}
