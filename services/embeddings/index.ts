export type { IEmbeddingProvider } from "./embeddings.interface";
export {
  embeddingRegistry,
  getEmbeddingProvider,
  DEFAULT_EMBEDDING_PROVIDER,
} from "./embeddings.registry";
export { PlaceholderEmbeddingProvider } from "./providers/placeholder.provider";
