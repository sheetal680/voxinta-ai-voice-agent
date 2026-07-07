import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { getAgent } from "@/features/agents/queries";
import { ToolToggleRow } from "@/features/integrations/components/tool-toggle-row";
import { getToolConfigsForAgent } from "@/features/integrations/queries";

// Depends on the caller's cookie-scoped auth session — must never be
// statically prerendered.
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ agentId: string }>;
}): Promise<Metadata> {
  const { agentId } = await params;
  const agent = await getAgent(agentId);
  return { title: agent ? `${agent.name} — Integrations — Voxinta` : "Integrations — Voxinta" };
}

export default async function AgentIntegrationsPage({
  params,
}: {
  params: Promise<{ agentId: string }>;
}) {
  const { agentId } = await params;
  const agent = await getAgent(agentId);

  if (!agent) {
    notFound();
  }

  const tools = await getToolConfigsForAgent(agent.id);

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
            Enable or disable which tools {agent.name} can call during a conversation.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {tools.map((tool) => (
          <ToolToggleRow key={tool.name} agentId={agent.id} tool={tool} />
        ))}
      </div>
    </div>
  );
}
