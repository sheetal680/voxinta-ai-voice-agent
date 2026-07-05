import { EXTENSION_TO_TYPE, type DocumentType } from "../constants";

/** Resolve a document type from a filename's extension, or null if unsupported. */
export function resolveDocumentType(filename: string): DocumentType | null {
  const extension = filename.split(".").pop()?.toLowerCase();
  if (!extension) return null;
  return EXTENSION_TO_TYPE[extension] ?? null;
}
