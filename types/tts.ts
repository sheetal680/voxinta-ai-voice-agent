/**
 * Provider-agnostic Text-to-Speech (TTS) data types.
 *
 * The contract (speak / stop / pause / resume + getVoices) intentionally
 * hides *how* audio is produced. The browser provider drives
 * `SpeechSynthesis` directly; a future ElevenLabs/OpenAI/Piper provider
 * fetches audio and plays it through an `Audio` element behind the same
 * methods, so callers never change.
 */

export type TTSProviderId = "browser" | "elevenlabs" | "openai" | "piper";

export type TTSStatus = "idle" | "speaking" | "paused" | "error";

export interface TTSVoice {
  /** Stable identifier: a `voiceURI` for browser, a voice id for cloud APIs. */
  id: string;
  name: string;
  /** BCP-47 language tag. */
  lang: string;
  isDefault?: boolean;
}

export interface TTSOptions {
  voiceId?: string;
  lang?: string;
  /** Speaking rate. Browser range ~0.1–10, default 1. */
  rate?: number;
  /** Voice pitch. Browser range 0–2, default 1. */
  pitch?: number;
  /** Volume 0–1, default 1. */
  volume?: number;
}

export interface TTSEventHandlers {
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: Error) => void;
  /** Fired as playback crosses word/char boundaries, for caption sync. */
  onBoundary?: (charIndex: number) => void;
}
