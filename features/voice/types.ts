/**
 * Status of the voice conversation flow, driving the mic button's
 * appearance and the status indicator text.
 *
 * idle      → ready; mic button available.
 * listening → recording + transcribing the user's speech.
 * thinking  → transcript sent, waiting on the LLM's first token.
 * speaking  → speaking the (possibly still-streaming) reply aloud.
 * denied    → microphone permission was refused.
 * error     → STT/TTS failed for some other reason.
 */
export type VoiceStatus = "idle" | "listening" | "thinking" | "speaking" | "denied" | "error";
