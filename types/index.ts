/**
 * Barrel for provider-agnostic domain types.
 *
 * Import shared data shapes from here (`@/types`) anywhere in the app —
 * UI, hooks, API routes — without reaching into the service layer.
 */

export * from "./llm";
export * from "./stt";
export * from "./tts";
export * from "./embeddings";
