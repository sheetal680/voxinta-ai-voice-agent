"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getSTTProvider } from "@/services/stt";
import { getTTSProvider } from "@/services/tts";
import type { ITTSProvider } from "@/services/tts";
import type { TTSOptions } from "@/types";
import { SentenceChunker } from "../lib/sentence-chunker";
import type { VoiceStatus } from "../types";

/** Rough speaking-rate estimate, generous enough to not cut off real speech. */
const CHARS_PER_SECOND = 12;
const MIN_TIMEOUT_MS = 6000;
const MAX_TIMEOUT_MS = 20000;

/**
 * `SpeechSynthesisUtterance.onend` is known to occasionally never fire in
 * some browser/automation contexts, which would otherwise hang this chunk's
 * turn in the speak queue forever (and the UI stuck on "speaking"). Race the
 * real speak() promise against a generous, length-based timeout so a single
 * flaky utterance can't wedge the whole conversation.
 */
function speakWithTimeout(
  provider: ITTSProvider,
  text: string,
  options: TTSOptions,
): Promise<void> {
  const timeoutMs = Math.min(
    MAX_TIMEOUT_MS,
    Math.max(MIN_TIMEOUT_MS, (text.length / CHARS_PER_SECOND) * 1000 + 3000),
  );

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      provider.stop();
      reject(new Error("Speech synthesis timed out."));
    }, timeoutMs);

    provider.speak(text, options).then(
      () => {
        clearTimeout(timer);
        resolve();
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

/**
 * Orchestrates the full voice turn: mic → STT transcript → hand off to the
 * caller's send function → (while the reply streams in) chunk completed
 * sentences to TTS as they arrive, rather than waiting for the whole reply —
 * the "minimal perceived latency" optimization from the PRD.
 *
 * Doesn't own the LLM stream itself — `streamingContent`/`isStreaming` are
 * the same state ChatInterface already tracks for the text pipeline; this
 * hook just watches them. Whether the *current* reply should be spoken is
 * tracked internally (a voice-initiated turn always should be) rather than
 * via a prop, so the caller can't accidentally leave it out of sync — see
 * `cancelSpeaking()`, which ChatInterface calls when a *different* turn
 * (a typed message, or regenerate) starts while a voice reply is still
 * being read aloud.
 */
export function useVoiceConversation({
  streamingContent,
  isStreaming,
  voiceId,
  lang,
  onFinalTranscript,
}: {
  streamingContent: string;
  isStreaming: boolean;
  voiceId?: string | null;
  lang?: string | null;
  onFinalTranscript: (transcript: string) => void;
}) {
  const [status, setStatus] = useState<VoiceStatus>("idle");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [isSupported, setIsSupported] = useState(false);

  const sttRef = useRef(getSTTProvider());
  const ttsRef = useRef(getTTSProvider());
  const chunkerRef = useRef<SentenceChunker | null>(null);
  const speakQueueRef = useRef<Promise<void>>(Promise.resolve());
  const speakingTurnRef = useRef(false);
  const interruptedRef = useRef(false);
  const finalTranscriptRef = useRef("");
  const hadErrorRef = useRef(false);

  // Environment support can only be known client-side, after mount.
  useEffect(() => {
    setIsSupported(sttRef.current.isSupported() && ttsRef.current.isSupported());
  }, []);

  // Speak newly-completed sentences as the reply streams in; flush the
  // remainder and hand back to idle once streaming ends.
  useEffect(() => {
    if (!speakingTurnRef.current || interruptedRef.current || !chunkerRef.current) return;

    const chunks = isStreaming
      ? chunkerRef.current.next(streamingContent)
      : chunkerRef.current.flush(streamingContent);

    for (const chunk of chunks) {
      speakQueueRef.current = speakQueueRef.current.then(async () => {
        if (interruptedRef.current) return;
        setStatus("speaking");
        try {
          await speakWithTimeout(ttsRef.current, chunk, {
            voiceId: voiceId ?? undefined,
            lang: lang ?? undefined,
          });
        } catch {
          // One bad or hung utterance shouldn't derail the rest of the queue
          // or wedge the conversation in "speaking" forever — see
          // speakWithTimeout's comment for why this can genuinely happen.
        }
      });
    }

    if (!isStreaming) {
      speakQueueRef.current = speakQueueRef.current.then(() => {
        if (!interruptedRef.current) {
          speakingTurnRef.current = false;
          setStatus("idle");
        }
      });
    }
  }, [streamingContent, isStreaming, voiceId, lang]);

  const startListening = useCallback(() => {
    if (!isSupported) return;
    setInterimTranscript("");
    finalTranscriptRef.current = "";
    // Cleared on error, checked in onEnd below — see the comment there.
    hadErrorRef.current = false;

    sttRef.current.start(
      { lang: lang ?? "en-US", continuous: false, interimResults: true },
      {
        onResult: (result) => {
          if (result.isFinal) {
            finalTranscriptRef.current = `${finalTranscriptRef.current} ${result.transcript}`.trim();
          }
          setInterimTranscript(result.transcript);
        },
        onStatusChange: (sttStatus) => {
          if (sttStatus === "listening") setStatus("listening");
        },
        onError: (error) => {
          hadErrorRef.current = true;
          setStatus(error.message.includes("not-allowed") ? "denied" : "error");
        },
        onEnd: () => {
          setInterimTranscript("");
          // The browser always fires "end" right after "error" — don't let
          // that clobber the denied/error status back to idle before the
          // user ever sees it.
          if (hadErrorRef.current) return;

          const transcript = finalTranscriptRef.current.trim();
          if (!transcript) {
            setStatus("idle");
            return;
          }
          // Arm the speaking pipeline for this turn's reply *before* handing
          // the transcript off, so the streaming-watcher effect above is
          // ready the moment streamingContent starts growing.
          chunkerRef.current = new SentenceChunker();
          interruptedRef.current = false;
          speakingTurnRef.current = true;
          setStatus("thinking");
          onFinalTranscript(transcript);
        },
      },
    );
  }, [isSupported, lang, onFinalTranscript]);

  const stopListening = useCallback(() => {
    sttRef.current.stop();
  }, []);

  /** Stop any in-progress or queued speech and return to idle. */
  const cancelSpeaking = useCallback(() => {
    interruptedRef.current = true;
    speakingTurnRef.current = false;
    ttsRef.current.stop();
    setStatus((current) => (current === "listening" ? current : "idle"));
  }, []);

  const toggleMic = useCallback(() => {
    if (status === "listening") {
      stopListening();
    } else if (status === "thinking" || status === "speaking") {
      cancelSpeaking();
      startListening();
    } else {
      startListening();
    }
  }, [status, startListening, stopListening, cancelSpeaking]);

  // Tear down any in-flight recognition/speech if the component unmounts
  // mid-conversation (e.g. navigating away).
  useEffect(() => {
    const stt = sttRef.current;
    const tts = ttsRef.current;
    return () => {
      stt.abort();
      tts.stop();
    };
  }, []);

  return { status, interimTranscript, isSupported, toggleMic, cancelSpeaking };
}
