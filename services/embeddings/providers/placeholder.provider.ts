import type { EmbeddingResponse, EmbedParams } from "@/types";
import { ProviderError } from "@/services/shared/errors";
import type { IEmbeddingProvider } from "../embeddings.interface";

/**
 * Placeholder embedding provider.
 *
 * Exists so callers can be written against `IEmbeddingProvider` today. It has
 * no real backend yet — calling `embed()` throws. Wire a real provider (Groq
 * or another) during the RAG phase and register it in the embeddings
 * registry; no caller changes required.
 */
export class PlaceholderEmbeddingProvider implements IEmbeddingProvider {
  readonly id = "placeholder" as const;
  readonly dimensions = 0;

  async embed(_params: EmbedParams): Promise<EmbeddingResponse> {
    void _params;
    throw new ProviderError(
      "embeddings",
      "No embedding provider is configured yet. This will be wired up in the RAG phase " +
        "(see PRD → 'Knowledge Base (RAG)').",
      { providerId: this.id },
    );
  }
}
