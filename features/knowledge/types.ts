import type { DocumentStatus, DocumentType } from "./constants";

/**
 * A transient, client-only row for a document currently being uploaded and
 * processed in this session — shown in the list immediately, ahead of the
 * next `router.refresh()` that brings in the real persisted row.
 */
export interface UploadingDocumentItem {
  id: string;
  filename: string;
  type: DocumentType;
  status: DocumentStatus;
  error?: string | null;
}
