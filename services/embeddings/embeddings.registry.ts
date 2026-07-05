import type { EmbeddingProviderId } from "@/types";
import { getEnv } from "@/services/shared/env";
import { ProviderRegistry } from "@/services/shared/registry";
import type { IEmbeddingProvider } from "./embeddings.interface";
import { OpenAIEmbeddingProvider } from "./providers/openai.provider";
import { PlaceholderEmbeddingProvider } from "./providers/placeholder.provider";

/**
 * Registry of available embedding providers.
 *
 * To add another provider (Cohere, a local model):
 *   1. add its id to `EmbeddingProviderId` in `types/embeddings.ts`
 *      (already includes cohere/local),
 *   2. implement `IEmbeddingProvider`,
 *   3. register it below.
 */
export const embeddingRegistry = new ProviderRegistry<EmbeddingProviderId, IEmbeddingProvider>()
  .register("openai", () => new OpenAIEmbeddingProvider())
  .register("placeholder", () => new PlaceholderEmbeddingProvider());

/** Provider id used when `EMBEDDING_PROVIDER` is unset. */
export const DEFAULT_EMBEDDING_PROVIDER: EmbeddingProviderId = "openai";

/**
 * Resolve the active embedding provider. Pass an explicit id to override;
 * otherwise reads `EMBEDDING_PROVIDER`, falling back to OpenAI.
 */
export function getEmbeddingProvider(id?: EmbeddingProviderId): IEmbeddingProvider {
  const providerId =
    id ??
    (getEnv("EMBEDDING_PROVIDER") as EmbeddingProviderId | undefined) ??
    DEFAULT_EMBEDDING_PROVIDER;
  return embeddingRegistry.resolve(providerId);
}
