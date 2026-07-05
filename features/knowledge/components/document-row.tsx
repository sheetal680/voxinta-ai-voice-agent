"use client";

import { FileText, Loader2, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { DocumentStatus, DocumentType } from "../constants";
import { formatBytes } from "../lib/format-bytes";
import { DeleteDocumentDialog } from "./delete-document-dialog";
import { DocumentStatusBadge } from "./document-status-badge";

export function DocumentRow({
  filename,
  type,
  status,
  error,
  sizeBytes,
  onRetry,
  isRetrying,
  onDelete,
}: {
  filename: string;
  type: DocumentType;
  status: DocumentStatus;
  error?: string | null;
  sizeBytes?: number | null;
  onRetry?: () => void;
  isRetrying?: boolean;
  onDelete?: () => Promise<void>;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border/50 bg-card/60 px-3 py-2.5">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
        <FileText className="size-4" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{filename}</p>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
          <span className="uppercase">{type}</span>
          {sizeBytes != null && (
            <>
              <span aria-hidden>·</span>
              <span>{formatBytes(sizeBytes)}</span>
            </>
          )}
        </div>
        {status === "failed" && error && <p className="mt-1 text-xs text-destructive">{error}</p>}
      </div>

      <DocumentStatusBadge status={status} />

      {onRetry && status !== "ready" && (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onRetry}
          disabled={isRetrying}
          aria-label="Retry processing"
        >
          {isRetrying ? <Loader2 className="animate-spin" /> : <RotateCcw />}
        </Button>
      )}

      {onDelete && <DeleteDocumentDialog filename={filename} onConfirm={onDelete} />}
    </div>
  );
}
