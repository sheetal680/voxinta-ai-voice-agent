/**
 * Provider-agnostic LLM data types.
 *
 * These describe the *shape of data* that flows in and out of any LLM
 * provider. They must never reference a specific vendor (Groq, OpenAI, ...).
 * The provider contract itself lives in `services/llm/llm.interface.ts`.
 */

export type LLMProviderId = "groq" | "openai" | "anthropic" | "gemini" | "ollama";

export type LLMRole = "system" | "user" | "assistant" | "tool";

export interface LLMMessage {
  role: LLMRole;
  content: string;
  /** Optional author name (used by some providers for multi-agent/tool turns). */
  name?: string;
  /** Set on `role: "tool"` messages to correlate with a prior tool call. */
  toolCallId?: string;
}

/** Why generation stopped. Normalized across providers. */
export type LLMFinishReason =
  | "stop"
  | "length"
  | "tool_calls"
  | "content_filter"
  | "error"
  | "unknown";

export interface LLMUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

/**
 * Inputs to a single generation. Optional tuning fields fall back to the
 * provider's configured defaults when omitted.
 */
export interface LLMGenerateParams {
  messages: LLMMessage[];
  /** Overrides the provider's default model for this call. */
  model?: string;
  /** 0–2. Higher = more random. */
  temperature?: number;
  /** Max tokens to generate in the completion. */
  maxTokens?: number;
  /** Nucleus sampling, 0–1. */
  topP?: number;
  /** Stop sequences. */
  stop?: string[];
  /** Abort in-flight requests / streams. */
  signal?: AbortSignal;
}

/** Result of a non-streaming generation. */
export interface LLMResponse {
  content: string;
  model: string;
  finishReason: LLMFinishReason;
  usage?: LLMUsage;
  /** Untyped provider payload, for debugging/logging only. Do not depend on it. */
  raw?: unknown;
}

/** One incremental chunk emitted by a streaming generation. */
export interface LLMStreamChunk {
  /** Newly produced text since the previous chunk (may be ""). */
  delta: string;
  /** True on the terminal chunk. */
  done: boolean;
  /** Present on the terminal chunk when known. */
  finishReason?: LLMFinishReason;
  /** Usually only populated on the terminal chunk. */
  usage?: LLMUsage;
}

/** Runtime configuration for an LLM provider (read from env by its factory). */
export interface LLMProviderConfig {
  apiKey?: string;
  baseUrl?: string;
  defaultModel: string;
}
