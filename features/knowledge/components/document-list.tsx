"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileText } from "lucide-react";

import type { KnowledgeDocument } from "@/types/database";
import { deleteKnowledgeDocument, processKnowledgeDocument } from "../actions";
import type { DocumentType } from "../constants";
import type { UploadingDocumentItem } from "../types";
import { DocumentRow } from "./document-row";
import { DocumentUpload } from "./document-upload";

export function DocumentList({
  agentId,
  initialDocuments,
}: {
  agentId: string;
  initialDocuments: KnowledgeDocument[];
}) {
  const router = useRouter();
  const [documents, setDocuments] = useState(initialDocuments);
  const [uploading, setUploading] = useState<UploadingDocumentItem[]>([]);
  const [retryingId, setRetryingId] = useState<string>();

  // Once the server re-fetches (after any mutation's router.refresh()), the
  // fresh list supersedes any transient upload rows. Adjusting state during
  // render (comparing against the last-seen prop) rather than in an effect
  // avoids an extra committed render showing stale data first.
  const [prevInitialDocuments, setPrevInitialDocuments] = useState(initialDocuments);
  if (initialDocuments !== prevInitialDocuments) {
    setPrevInitialDocuments(initialDocuments);
    setDocuments(initialDocuments);
    setUploading([]);
  }

  function patchUploading(currentId: string, patch: Partial<UploadingDocumentItem>) {
    setUploading((prev) => prev.map((item) => (item.id === currentId ? { ...item, ...patch } : item)));
  }

  async function handleRetry(documentId: string) {
    setRetryingId(documentId);
    setDocuments((prev) =>
      prev.map((doc) => (doc.id === documentId ? { ...doc, status: "processing", error: null } : doc)),
    );
    const result = await processKnowledgeDocument(documentId);
    setDocuments((prev) =>
      prev.map((doc) =>
        doc.id === documentId
          ? {
              ...doc,
              status: result.success ? "ready" : "failed",
              error: result.success ? null : (result.message ?? "Failed to process document."),
            }
          : doc,
      ),
    );
    setRetryingId(undefined);
    router.refresh();
  }

  async function handleDelete(documentId: string) {
    setDocuments((prev) => prev.filter((doc) => doc.id !== documentId));
    await deleteKnowledgeDocument(documentId);
    router.refresh();
  }

  const isEmpty = uploading.length === 0 && documents.length === 0;

  return (
    <div className="flex flex-col gap-4">
      <DocumentUpload
        agentId={agentId}
        onStart={(item) => setUploading((prev) => [item, ...prev])}
        onStatusChange={patchUploading}
        onSettled={() => router.refresh()}
      />

      {isEmpty ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border px-6 py-10 text-center">
          <FileText className="size-6 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            No documents yet — upload a file so this agent can reference it.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {uploading.map((item) => (
            <DocumentRow
              key={item.id}
              filename={item.filename}
              type={item.type}
              status={item.status}
              error={item.error}
            />
          ))}
          {documents.map((doc) => (
            <DocumentRow
              key={doc.id}
              filename={doc.filename}
              type={doc.type as DocumentType}
              status={doc.status as UploadingDocumentItem["status"]}
              error={doc.error}
              sizeBytes={doc.size_bytes}
              onRetry={() => handleRetry(doc.id)}
              isRetrying={retryingId === doc.id}
              onDelete={() => handleDelete(doc.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
