"use client";

import { motion } from "framer-motion";

import { cn } from "@/lib/utils";
import type { VoiceStatus } from "../types";

const LABELS: Record<Exclude<VoiceStatus, "idle">, string> = {
  listening: "Listening…",
  thinking: "Thinking…",
  speaking: "Speaking…",
  denied: "Microphone access was denied. Enable it in your browser settings to use voice.",
  error: "Something went wrong with voice input. Try again, or type instead.",
};

export function VoiceStatusBar({
  status,
  interimTranscript,
}: {
  status: VoiceStatus;
  interimTranscript: string;
}) {
  if (status === "idle") return null;

  const isProblem = status === "denied" || status === "error";
  const isActive = status === "listening" || status === "thinking" || status === "speaking";
  const label = status === "listening" && interimTranscript ? interimTranscript : LABELS[status];

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-4 pb-2 text-xs",
        isProblem ? "text-destructive" : "text-muted-foreground",
      )}
      role={isProblem ? "alert" : "status"}
    >
      {isActive && (
        <span className="flex shrink-0 gap-0.5">
          {[0, 1, 2].map((dot) => (
            <motion.span
              key={dot}
              className="size-1 rounded-full bg-current"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1, repeat: Infinity, delay: dot * 0.15 }}
            />
          ))}
        </span>
      )}
      {/* min-w-0 lets this flex child actually shrink to the row's width —
          without it, a flex item won't wrap/shrink below its content's
          intrinsic width and the text silently overflows the card. */}
      <span className="min-w-0">{label}</span>
    </div>
  );
}
