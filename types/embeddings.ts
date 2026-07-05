/**
 * Provider-agnostic embedding data types.
 *
 * `openai` is the default real provider (see
 * services/embeddings/providers/openai.provider.ts) — its 1536-dimension
 * output matches the `vector(1536)` column on `document_chunks`. `cohere`/
 * `local` are reserved ids for future providers; `placeholder` remains for
 * tests/environments with no embedding provider configured.
 */

export type EmbeddingProviderId = "placeholder" | "openai" | "cohere" | "local";

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
