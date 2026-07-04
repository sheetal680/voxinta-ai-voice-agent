/**
 * Provider-agnostic embedding data types.
 *
 * Real implementations arrive in the RAG phase (see PRD → "Knowledge Base
 * (RAG)"). For now the interface + a placeholder provider exist so callers
 * can be written against the contract today.
 */

export type EmbeddingProviderId =
  | "placeholder"
  | "groq"
  | "openai"
  | "cohere"
  | "local";

export interface EmbedParams {
  /** A single string or a batch of strings to embed. */
  input: string | string[];
  /** Overrides the provider's default embedding model. */
  model?: string;
}

export interface EmbeddingResponse {
  /** One vector per input, in the same order as `input`. */
  embeddings: number[][];
  model: string;
  /** Length of each vector. */
  dimensions: number;
  usage?: {
    totalTokens: number;
  };
}
