import type { Metadata } from "next";
import { FileText } from "lucide-react";
import { EmptyState } from "../../_components/empty-state";

export const metadata: Metadata = { title: "Knowledge Base — Voxinta" };

export default function KnowledgePage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Knowledge Base</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload documents your agents can search and reference during a conversation.
        </p>
      </div>

      <EmptyState
        icon={FileText}
        title="No documents yet"
        description="Upload a PDF, DOCX, TXT, or Markdown file to give an agent something to reference."
      />
    </div>
  );
}
