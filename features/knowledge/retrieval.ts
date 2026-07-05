import type { SupabaseClient } from "@supabase/supabase-js";
import { getEmbeddingProvider } from "@/services/embeddings";
import type { Database } from "@/types/database";
import { RETRIEVAL_MATCH_COUNT, RETRIEVAL_MIN_SIMILARITY } from "./constants";
import { toVectorLiteral } from "./lib/vector-literal";

/**
 * Embeds `query` and returns the most relevant chunks from `agentId`'s
 * knowledge base, above the similarity floor — or an empty array if the
 * agent has no documents, embeddings aren't configured, or anything else
 * goes wrong. Retrieval augments a chat turn; it should never be the reason
 * a chat turn fails, so every failure mode here is caught and logged rather
 * than thrown.
 */
export async function retrieveContext(
  supabase: SupabaseClient<Database>,
  agentId: string,
  query: string,
): Promise<string[]> {
  try {
    const provider = getEmbeddingProvider();
    const { embeddings } = await provider.embed({ input: query });
    const queryEmbedding = embeddings[0];
    if (!queryEmbedding) return [];

    const { data, error } = await supabase.rpc("match_document_chunks", {
      query_embedding: toVectorLiteral(queryEmbedding),
      match_count: RETRIEVAL_MATCH_COUNT,
      filter_agent_id: agentId,
    });

    if (error) {
      console.error("[knowledge] retrieval failed:", error.message);
      return [];
    }

    return (data ?? [])
      .filter((row) => row.similarity >= RETRIEVAL_MIN_SIMILARITY)
      .map((row) => row.content);
  } catch (error) {
    console.error("[knowledge] retrieval failed:", error);
    return [];
  }
}
