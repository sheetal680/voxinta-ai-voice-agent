import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Separator } from "@/components/ui/separator";
import { AgentForm } from "@/features/agents/components/agent-form";
import { DeleteAgentDialog } from "@/features/agents/components/delete-agent-dialog";
import { getAgent } from "@/features/agents/queries";
import { StartChatButton } from "@/features/chat/components/start-chat-button";
import { DocumentList } from "@/features/knowledge/components/document-list";
import { getDocuments } from "@/features/knowledge/queries";

// Depends on the caller's cookie-scoped auth session — must never be
// statically prerendered.
export const dynamic = "force-dynamic";
// Extends the default Server Action timeout for this page: uploading a
// knowledge-base document runs extract → chunk → batch-embed → store, which
// can legitimately take longer than the platform default for larger files.
export const maxDuration = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const agent = await getAgent(id);
  return { title: agent ? `${agent.name} — Voxinta` : "Agent — Voxinta" };
}

export default async function AgentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const agent = await getAgent(id);

  if (!agent) {
    notFound();
  }

  const documents = await getDocuments(agent.id);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{agent.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Update this agent&apos;s configuration below.
          </p>
        </div>
        <div className="flex items-start gap-2">
          <StartChatButton agentId={agent.id} />
          <DeleteAgentDialog agentId={agent.id} agentName={agent.name} />
        </div>
      </div>
      <AgentForm agent={agent} />

      <Separator />

      <div className="flex flex-col gap-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Knowledge base</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Upload documents so {agent.name} can reference them during conversations.
          </p>
        </div>
        <DocumentList agentId={agent.id} initialDocuments={documents} />
      </div>
    </div>
  );
}
