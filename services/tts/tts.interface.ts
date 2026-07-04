import type {
  TTSEventHandlers,
  TTSOptions,
  TTSProviderId,
  TTSStatus,
  TTSVoice,
} from "@/types";

/**
 * Contract every Text-to-Speech provider must satisfy.
 *
 * The browser provider drives `SpeechSynthesis`; a future ElevenLabs /
 * OpenAI / Piper provider fetches audio and plays it through an `Audio`
 * element behind these same methods, so callers never change.
 */
export interface ITTSProvider {
  readonly id: TTSProviderId;

  /** Whether this provider can run in the current environment. */
  isSupported(): boolean;

  /**
   * Speak `text`. Resolves when playback finishes (or rejects on error).
   * Interim progress is reported through `handlers`.
   */
  speak(text: string, options?: TTSOptions, handlers?: TTSEventHandlers): Promise<void>;

  stop(): void;
  pause(): void;
  resume(): void;

  /** Voices available from this provider (may load asynchronously). */
  getVoices(): Promise<TTSVoice[]>;

  getStatus(): TTSStatus;
}
