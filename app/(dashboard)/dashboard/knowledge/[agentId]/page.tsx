import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { getAgent } from "@/features/agents/queries";
import { DocumentList } from "@/features/knowledge/components/document-list";
import { getDocuments } from "@/features/knowledge/queries";

// Depends on the caller's cookie-scoped auth session — must never be
// statically prerendered.
export const dynamic = "force-dynamic";
// Extends the default Server Action timeout: uploading a document runs
// extract → chunk → batch-embed → store, which can legitimately take longer
// than the platform default for larger files (mirrors the agent detail page,
// which hosted this same upload flow before it got its own route).
export const maxDuration = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ agentId: string }>;
}): Promise<Metadata> {
  const { agentId } = await params;
  const agent = await getAgent(agentId);
  return { title: agent ? `${agent.name} — Knowledge base — Voxinta` : "Knowledge base — Voxinta" };
}

export default async function AgentKnowledgeBasePage({
  params,
}: {
  params: Promise<{ agentId: string }>;
}) {
  const { agentId } = await params;
  const agent = await getAgent(agentId);

  if (!agent) {
    notFound();
  }

  const documents = await getDocuments(agent.id);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div className="flex items-center gap-3">
        <Link
          href={`/dashboard/agents/${agent.id}`}
          className="text-muted-foreground transition-colors hover:text-foreground"
          aria-label="Back to agent"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">{agent.name}</h1>
          <p className="text-sm text-muted-foreground">
            Upload documents so {agent.name} can reference them during conversations.
          </p>
        </div>
      </div>

      <DocumentList agentId={agent.id} initialDocuments={documents} />
    </div>
  );
}
