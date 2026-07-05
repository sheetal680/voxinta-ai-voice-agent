"use client";

import { useRef, useState } from "react";
import { Loader2, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { processKnowledgeDocument, uploadKnowledgeDocument } from "../actions";
import { KNOWLEDGE_MAX_FILE_SIZE_BYTES } from "../constants";
import { resolveDocumentType } from "../lib/document-type";
import type { UploadingDocumentItem } from "../types";

export function DocumentUpload({
  agentId,
  onStart,
  onStatusChange,
  onSettled,
}: {
  agentId: string;
  onStart: (item: UploadingDocumentItem) => void;
  onStatusChange: (currentId: string, patch: Partial<UploadingDocumentItem>) => void;
  onSettled: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string>();

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    // Allow re-selecting the same file (e.g. after fixing a rejected upload).
    event.target.value = "";
    if (!file) return;

    setError(undefined);

    const documentType = resolveDocumentType(file.name);
    if (!documentType) {
      setError("Unsupported file type. Upload a PDF, DOCX, TXT, or Markdown file.");
      return;
    }
    if (file.size > KNOWLEDGE_MAX_FILE_SIZE_BYTES) {
      setError("File must be 10MB or smaller.");
      return;
    }

    setIsBusy(true);
    const tempId = crypto.randomUUID();
    // Tracks whichever id currently identifies this row in the parent's
    // uploading list — it's relabeled from tempId to the real documentId
    // partway through, and the catch block below needs whichever is current.
    let currentId = tempId;
    onStart({ id: tempId, filename: file.name, type: documentType, status: "pending" });

    try {
      const formData = new FormData();
      formData.set("file", file);
      formData.set("agentId", agentId);

      const uploadResult = await uploadKnowledgeDocument(formData);
      if (!uploadResult.success || !uploadResult.data) {
        onStatusChange(currentId, {
          status: "failed",
          error: uploadResult.message ?? "Upload failed.",
        });
        return;
      }

      const documentId = uploadResult.data.documentId;
      onStatusChange(currentId, { id: documentId, status: "processing" });
      currentId = documentId;

      const processResult = await processKnowledgeDocument(documentId);
      onStatusChange(currentId, {
        status: processResult.success ? "ready" : "failed",
        error: processResult.success ? null : (processResult.message ?? "Failed to process document."),
      });
    } catch (caughtError) {
      // A thrown (not returned) failure is unexpected — e.g. missing server
      // config — but the row must still resolve to "failed" rather than
      // being stuck on "pending"/"processing" until the next refresh.
      onStatusChange(currentId, {
        status: "failed",
        error: caughtError instanceof Error ? caughtError.message : "Something went wrong. Please try again.",
      });
    } finally {
      setIsBusy(false);
      onSettled();
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.docx,.txt,.md,.markdown"
        className="hidden"
        onChange={handleFileChange}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-fit"
        disabled={isBusy}
        onClick={() => inputRef.current?.click()}
      >
        {isBusy ? (
          <>
            <Loader2 className="animate-spin" /> Uploading…
          </>
        ) : (
          <>
            <Upload /> Upload document
          </>
        )}
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
      <p className="text-xs text-muted-foreground">PDF, DOCX, TXT, or Markdown — up to 10MB.</p>
    </div>
  );
}
