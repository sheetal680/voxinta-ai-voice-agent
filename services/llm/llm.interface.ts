import type {
  LLMGenerateParams,
  LLMProviderId,
  LLMResponse,
  LLMStreamChunk,
} from "@/types";

/**
 * Contract every LLM provider must satisfy.
 *
 * Business logic depends only on this interface — never on Groq/OpenAI/etc.
 * directly. Swapping providers means implementing this and registering it
 * (see `services/llm/llm.registry.ts`); no caller changes.
 */
export interface ILLMProvider {
  readonly id: LLMProviderId;

  /** One-shot completion. Resolves with the full response. */
  generate(params: LLMGenerateParams): Promise<LLMResponse>;

  /**
   * Streaming completion. Yields incremental chunks; the final chunk has
   * `done: true` and, when known, `finishReason`/`usage`.
   */
  streamGenerate(params: LLMGenerateParams): AsyncIterable<LLMStreamChunk>;
}
