/** pgvector's text input format: a bracketed, comma-separated list. */
export function toVectorLiteral(embedding: number[]): string {
  return `[${embedding.join(",")}]`;
}
