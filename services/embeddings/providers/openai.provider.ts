import type { EmbeddingResponse, EmbedParams } from "@/types";
import { ProviderError } from "@/services/shared/errors";
import { getEnv, requireEnv } from "@/services/shared/env";
import type { IEmbeddingProvider } from "../embeddings.interface";

/**
 * OpenAI embeddings provider (`text-embedding-3-small`, 1536 dimensions).
 *
 * SERVER-ONLY: reads `OPENAI_API_KEY`. Chosen as the default real provider
 * because its 1536-dimension output matches the `vector(1536)` column
 * already defined on `document_chunks` (see
 * supabase/migrations/20260704120400_knowledge_base.sql) — no schema change
 * needed to go live. Uses global `fetch`, no SDK, so it runs on both the
 * Node and Edge runtimes, consistent with GroqProvider.
 */
const DEFAULT_BASE_URL = "https://api.openai.com/v1";
const DEFAULT_MODEL = "text-embedding-3-small";
const DIMENSIONS = 1536;

interface OpenAIEmbeddingItem {
  embedding: number[];
  index: number;
}

interface OpenAIEmbeddingResponse {
  data: OpenAIEmbeddingItem[];
  model: string;
  usage?: { total_tokens: number };
}

export class OpenAIEmbeddingProvider implements IEmbeddingProvider {
  readonly id = "openai" as const;
  readonly dimensions = DIMENSIONS;

  private readonly baseUrl: string;
  private readonly defaultModel: string;

  constructor() {
    this.baseUrl = getEnv("OPENAI_EMBEDDING_BASE_URL", DEFAULT_BASE_URL) as string;
    this.defaultModel = getEnv("OPENAI_EMBEDDING_MODEL", DEFAULT_MODEL) as string;
  }

  async embed(params: EmbedParams): Promise<EmbeddingResponse> {
    const apiKey = requireEnv("OPENAI_API_KEY");

    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}/embeddings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: params.model ?? this.defaultModel,
          input: params.input,
        }),
      });
    } catch (cause) {
      throw new ProviderError("embeddings", "Failed to reach OpenAI embeddings API.", {
        cause,
        providerId: this.id,
        retryable: true,
      });
    }

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      throw new ProviderError(
        "embeddings",
        `OpenAI embeddings API error ${response.status}: ${detail}`,
        {
          status: response.status,
          providerId: this.id,
          retryable: response.status === 429 || response.status >= 500,
        },
      );
    }

    const data = (await response.json()) as OpenAIEmbeddingResponse;
    const sorted = [...data.data].sort((a, b) => a.index - b.index);

    return {
      embeddings: sorted.map((item) => item.embedding),
      model: data.model,
      dimensions: sorted[0]?.embedding.length ?? this.dimensions,
      usage: data.usage ? { totalTokens: data.usage.total_tokens } : undefined,
    };
  }
}
