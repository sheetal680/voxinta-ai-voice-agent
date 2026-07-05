"use client";

import { Mic, MicOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { VoiceStatus } from "../types";

export function MicButton({
  status,
  isSupported,
  onClick,
}: {
  status: VoiceStatus;
  isSupported: boolean;
  onClick: () => void;
}) {
  if (!isSupported) {
    return (
      <Button
        type="button"
        variant="outline"
        size="icon"
        disabled
        aria-label="Voice input isn't supported in this browser"
      >
        <MicOff className="text-muted-foreground" />
      </Button>
    );
  }

  const listening = status === "listening";

  return (
    <Button
      type="button"
      variant={listening ? "default" : "outline"}
      size="icon"
      onClick={onClick}
      aria-label={listening ? "Stop listening" : "Start voice input"}
      className={cn(listening && "animate-pulse")}
    >
      <Mic />
    </Button>
  );
}
