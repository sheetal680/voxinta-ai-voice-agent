import type { EmbeddingProviderId } from "@/types";
import { getEnv } from "@/services/shared/env";
import { ProviderRegistry } from "@/services/shared/registry";
import type { IEmbeddingProvider } from "./embeddings.interface";
import { PlaceholderEmbeddingProvider } from "./providers/placeholder.provider";

/**
 * Registry of available embedding providers.
 *
 * Only a placeholder is registered for now. During the RAG phase:
 *   1. add the real id to `EmbeddingProviderId` in `types/embeddings.ts`
 *      (already includes groq/openai/cohere/local),
 *   2. implement `IEmbeddingProvider`,
 *   3. register it below and point `EMBEDDING_PROVIDER` at it.
 */
export const embeddingRegistry = new ProviderRegistry<
  EmbeddingProviderId,
  IEmbeddingProvider
>().register("placeholder", () => new PlaceholderEmbeddingProvider());

/** Provider id used when `EMBEDDING_PROVIDER` is unset. */
export const DEFAULT_EMBEDDING_PROVIDER: EmbeddingProviderId = "placeholder";

/**
 * Resolve the active embedding provider. Pass an explicit id to override;
 * otherwise reads `EMBEDDING_PROVIDER`, falling back to the placeholder.
 */
export function getEmbeddingProvider(id?: EmbeddingProviderId): IEmbeddingProvider {
  const providerId =
    id ??
    (getEnv("EMBEDDING_PROVIDER") as EmbeddingProviderId | undefined) ??
    DEFAULT_EMBEDDING_PROVIDER;
  return embeddingRegistry.resolve(providerId);
}
