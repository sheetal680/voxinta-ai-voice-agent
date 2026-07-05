import type { LLMProviderId } from "@/types";

/** Every provider id the type system knows about — not all are registered yet
 * (see services/llm/llm.registry.ts), but "AI Settings" is a forward-looking
 * default a user can set ahead of a provider actually being wired up. */
export const AI_PROVIDER_OPTIONS: { value: LLMProviderId; label: string }[] = [
  { value: "groq", label: "Groq" },
  { value: "openai", label: "OpenAI" },
  { value: "anthropic", label: "Anthropic" },
  { value: "gemini", label: "Google Gemini" },
  { value: "ollama", label: "Ollama" },
];

export const DEFAULT_AI_PROVIDER: LLMProviderId = "groq";
export const DEFAULT_AI_TEMPERATURE = 0.7;
export const DEFAULT_AI_MAX_TOKENS = 1024;
/** Soft UI ceiling, mirrors features/agents/constants.ts. */
export const AI_MAX_TOKENS_CEILING = 8192;

/** Curated BYO-provider list for API Keys — providers users would plausibly supply their own key for. */
export const API_KEY_PROVIDER_VALUES = ["openai", "anthropic", "gemini", "groq", "elevenlabs"] as const;
export type ApiKeyProvider = (typeof API_KEY_PROVIDER_VALUES)[number];

export const API_KEY_PROVIDER_LABELS: Record<ApiKeyProvider, string> = {
  openai: "OpenAI",
  anthropic: "Anthropic",
  gemini: "Google Gemini",
  groq: "Groq",
  elevenlabs: "ElevenLabs",
};

export const DEFAULT_VOICE_LANGUAGE = "en-US";

export const AVATAR_MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2MB, mirrors the avatars storage bucket limit
export const AVATAR_ALLOWED_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
] as const;
