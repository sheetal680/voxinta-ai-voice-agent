/** Curated language list for the agent form's language Select — not exhaustive. */
export const LANGUAGE_OPTIONS = [
  { value: "en-US", label: "English (US)" },
  { value: "en-GB", label: "English (UK)" },
  { value: "es-ES", label: "Spanish (Spain)" },
  { value: "es-MX", label: "Spanish (Mexico)" },
  { value: "fr-FR", label: "French" },
  { value: "de-DE", label: "German" },
  { value: "it-IT", label: "Italian" },
  { value: "pt-BR", label: "Portuguese (Brazil)" },
  { value: "hi-IN", label: "Hindi" },
  { value: "ja-JP", label: "Japanese" },
  { value: "ko-KR", label: "Korean" },
  { value: "zh-CN", label: "Chinese (Simplified)" },
] as const;

export const DEFAULT_TEMPERATURE = 0.7;
export const DEFAULT_LANGUAGE = "en-US";
export const DEFAULT_MAX_TOKENS = 1024;
/** Soft UI ceiling — not DB-enforced — generous enough for any current LLM provider. */
export const MAX_TOKENS_CEILING = 8192;

export const AVATAR_MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2MB
export const AVATAR_ALLOWED_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
] as const;
