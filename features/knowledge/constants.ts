export type DocumentType = "pdf" | "docx" | "txt" | "md";

/** Mirrors the `status` check constraint on `knowledge_documents`. */
export type DocumentStatus = "pending" | "processing" | "ready" | "failed";

/** File extension → document type, the primary signal (mime types for .md
 * vary too much across browsers/OSes to rely on alone). */
export const EXTENSION_TO_TYPE: Record<string, DocumentType> = {
  pdf: "pdf",
  docx: "docx",
  txt: "txt",
  md: "md",
  markdown: "md",
};

export const KNOWLEDGE_MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

/** Target chunk size and overlap, in characters — see lib/chunk-text.ts. */
export const CHUNK_SIZE = 1000;
export const CHUNK_OVERLAP = 150;

/** Hard cap on chunks per document — bounds worst-case processing time
 * within a single Vercel Function invocation. */
export const MAX_CHUNKS_PER_DOCUMENT = 500;

/** How many chunks to retrieve per chat turn, and the similarity floor
 * (cosine similarity, 0–1) below which a match isn't worth injecting. */
export const RETRIEVAL_MATCH_COUNT = 5;
export const RETRIEVAL_MIN_SIMILARITY = 0.75;
