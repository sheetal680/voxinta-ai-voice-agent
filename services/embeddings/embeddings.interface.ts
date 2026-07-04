import type {
  EmbeddingProviderId,
  EmbeddingResponse,
  EmbedParams,
} from "@/types";

/**
 * Contract every embedding provider must satisfy.
 *
 * Real implementations land in the RAG phase (PRD → "Knowledge Base").
 * The chunk → embed → store → retrieve pipeline will depend only on this
 * interface, so the embedding backend (Groq, OpenAI, Cohere, local) can be
 * chosen/swapped without touching RAG business logic.
 */
export interface IEmbeddingProvider {
  readonly id: EmbeddingProviderId;

  /** Vector length this provider produces (0 until a real provider is wired). */
  readonly dimensions: number;

  /** Embed one string or a batch; returns one vector per input, in order. */
  embed(params: EmbedParams): Promise<EmbeddingResponse>;
}
