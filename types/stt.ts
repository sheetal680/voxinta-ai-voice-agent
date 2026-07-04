/**
 * Provider-agnostic Speech-to-Text (STT) data types.
 *
 * The interface is deliberately *session based* (start / stop + event
 * handlers) rather than a single `transcribe(blob)` call. This lets a
 * streaming provider (browser Web Speech API) and a batch provider
 * (server-side Whisper) both satisfy the same contract:
 *  - streaming providers emit interim + final results as speech arrives;
 *  - batch providers capture audio between start()/stop(), then emit a
 *    single final result once transcription returns.
 */

export type STTProviderId = "browser" | "whisper-api" | "faster-whisper";

export type STTStatus =
  | "idle"
  | "listening"
  | "processing"
  | "stopped"
  | "error";

export interface STTResult {
  transcript: string;
  /** False for live/interim hypotheses, true for a committed result. */
  isFinal: boolean;
  /** 0–1 when the provider reports it. */
  confidence?: number;
}

export interface STTOptions {
  /** BCP-47 language tag, e.g. "en-US". */
  lang?: string;
  /** Keep listening across pauses instead of stopping after one utterance. */
  continuous?: boolean;
  /** Emit interim (non-final) hypotheses. Ignored by batch providers. */
  interimResults?: boolean;
}

export interface STTEventHandlers {
  onResult?: (result: STTResult) => void;
  onStatusChange?: (status: STTStatus) => void;
  onError?: (error: Error) => void;
  onEnd?: () => void;
}
