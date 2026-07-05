import { CHUNK_OVERLAP, CHUNK_SIZE } from "../constants";

export interface ChunkOptions {
  /** Target chunk size, in characters. */
  chunkSize?: number;
  /** Overlap between consecutive chunks, in characters. */
  overlap?: number;
}

/**
 * Splits text into overlapping chunks for embedding, preferring to break at
 * a paragraph or sentence boundary near the target size rather than
 * mid-word — a hard cut is only used when no such boundary exists nearby.
 */
export function chunkText(text: string, options: ChunkOptions = {}): string[] {
  const chunkSize = options.chunkSize ?? CHUNK_SIZE;
  const overlap = Math.min(options.overlap ?? CHUNK_OVERLAP, Math.floor(chunkSize / 2));

  const normalized = text.replace(/\r\n/g, "\n").trim();
  if (!normalized) return [];

  const minBoundary = Math.floor(chunkSize * 0.5);
  const chunks: string[] = [];
  let start = 0;

  while (start < normalized.length) {
    let end = Math.min(start + chunkSize, normalized.length);

    if (end < normalized.length) {
      const window = normalized.slice(start, end);
      const paragraphBreak = window.lastIndexOf("\n\n");
      const sentenceBreak = Math.max(
        window.lastIndexOf(". "),
        window.lastIndexOf("! "),
        window.lastIndexOf("? "),
      );

      if (paragraphBreak >= minBoundary) {
        end = start + paragraphBreak + 2;
      } else if (sentenceBreak >= minBoundary) {
        end = start + sentenceBreak + 2;
      }
    }

    const chunk = normalized.slice(start, end).trim();
    if (chunk) chunks.push(chunk);

    if (end >= normalized.length) break;
    // Guarantee forward progress even in degenerate cases (e.g. overlap
    // landing exactly on the chosen boundary).
    start = Math.max(end - overlap, start + 1);
  }

  return chunks;
}
