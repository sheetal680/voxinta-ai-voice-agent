"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Mic } from "lucide-react";

import { cn } from "@/lib/utils";
import { aiDemoScript } from "./placeholder-content";
import { SectionHeading } from "./section-heading";

/**
 * A canned, client-only animation — NOT a real agent. No audio is captured,
 * no network calls are made, and no LLM/STT/TTS provider is involved. It
 * exists purely to give visitors a feel for the product's shape.
 */

type DemoStage = "idle" | "listening" | "transcribing" | "thinking" | "responding" | "done";

const TYPE_SPEED_MS = 28;
const WAVEFORM_HEIGHTS = [0.3, 0.6, 1, 0.5, 0.8, 0.4, 0.7];

const STAGE_LABEL: Record<DemoStage, string> = {
  idle: "Tap to speak",
  listening: "Listening…",
  transcribing: "Listening…",
  thinking: "Thinking…",
  responding: "Responding…",
  done: "Tap to replay",
};

function useTypewriter(text: string, active: boolean) {
  const [revealed, setRevealed] = useState("");

  useEffect(() => {
    if (!active) return;

    let index = 0;
    const interval = setInterval(() => {
      index += 1;
      setRevealed(text.slice(0, index));
      if (index >= text.length) clearInterval(interval);
    }, TYPE_SPEED_MS);
    return () => clearInterval(interval);
  }, [text, active]);

  // Derive the inactive case at read-time rather than resetting state
  // synchronously inside the effect (which would trigger a cascading render).
  return active ? revealed : "";
}

export function AiDemo() {
  const [stage, setStage] = useState<DemoStage>("idle");

  // Drives the canned sequence: each stage schedules the next one, and
  // cleans up its own timer if the stage changes (or the component unmounts)
  // before it fires.
  useEffect(() => {
    if (stage === "listening") {
      const id = setTimeout(() => setStage("transcribing"), 1400);
      return () => clearTimeout(id);
    }
    if (stage === "transcribing") {
      const id = setTimeout(
        () => setStage("thinking"),
        aiDemoScript.transcript.length * TYPE_SPEED_MS + 500,
      );
      return () => clearTimeout(id);
    }
    if (stage === "thinking") {
      const id = setTimeout(() => setStage("responding"), 1100);
      return () => clearTimeout(id);
    }
    if (stage === "responding") {
      const id = setTimeout(
        () => setStage("done"),
        aiDemoScript.response.length * TYPE_SPEED_MS + 800,
      );
      return () => clearTimeout(id);
    }
    if (stage === "done") {
      const id = setTimeout(() => setStage("idle"), 4000);
      return () => clearTimeout(id);
    }
  }, [stage]);

  const showTranscript = stage !== "idle" && stage !== "listening";
  const showResponse = stage === "responding" || stage === "done";
  const transcript = useTypewriter(aiDemoScript.transcript, showTranscript);
  const response = useTypewriter(aiDemoScript.response, showResponse);

  function handleMicClick() {
    if (stage === "idle" || stage === "done") {
      setStage("listening");
    }
  }

  const listening = stage === "listening";
  const thinking = stage === "thinking";

  return (
    <section id="ai-demo" className="scroll-mt-20 px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Live preview"
          title="See Voxinta think out loud"
          description="A lightweight preview, not a live agent — sign up to talk to a real one."
        />

        <div className="mx-auto mt-12 max-w-md">
          <div className="rounded-2xl border border-border/50 bg-card/60 p-6 shadow-xl backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Mic className="size-5" />
              </div>
              <div>
                <p className="text-sm font-medium">{aiDemoScript.agentName}</p>
                <p className="text-xs text-muted-foreground">{STAGE_LABEL[stage]}</p>
              </div>
            </div>

            <div className="mt-5 flex h-16 items-end gap-1 rounded-xl bg-muted/60 p-4">
              {WAVEFORM_HEIGHTS.map((height, index) => (
                <motion.span
                  key={index}
                  className={cn(
                    "w-1.5 rounded-full transition-colors",
                    listening ? "bg-primary/70" : "bg-muted-foreground/30",
                  )}
                  style={{ height: `${height * 32}px` }}
                  animate={listening ? { scaleY: [1, 0.4, 1] } : { scaleY: 1 }}
                  transition={{
                    duration: 1.2,
                    repeat: listening ? Infinity : 0,
                    ease: "easeInOut",
                    delay: index * 0.1,
                  }}
                />
              ))}
            </div>

            <div className="mt-5 min-h-24 space-y-2">
              {showTranscript && transcript && (
                <div className="ml-auto w-4/5 rounded-lg rounded-tr-sm bg-primary/10 px-3 py-2 text-xs text-foreground">
                  &ldquo;{transcript}&rdquo;
                </div>
              )}
              {thinking && (
                <div className="mr-auto flex w-fit items-center gap-1 rounded-lg rounded-tl-sm bg-muted px-3 py-2">
                  {[0, 1, 2].map((dot) => (
                    <motion.span
                      key={dot}
                      className="size-1.5 rounded-full bg-muted-foreground/60"
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1, repeat: Infinity, delay: dot * 0.15 }}
                    />
                  ))}
                </div>
              )}
              {showResponse && response && (
                <div className="mr-auto w-4/5 rounded-lg rounded-tl-sm bg-muted px-3 py-2 text-xs text-muted-foreground">
                  {response}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleMicClick}
              disabled={stage !== "idle" && stage !== "done"}
              className={cn(
                "mx-auto mt-5 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform",
                "disabled:cursor-not-allowed",
                listening && "animate-pulse",
              )}
              aria-label={STAGE_LABEL[stage]}
            >
              <Mic className="size-6" />
            </button>
          </div>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            Simulated conversation for preview purposes — no audio is recorded.
          </p>
        </div>
      </div>
    </section>
  );
}
