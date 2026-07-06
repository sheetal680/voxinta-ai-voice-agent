import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FileText } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AgentForm } from "@/features/agents/components/agent-form";
import { DeleteAgentDialog } from "@/features/agents/components/delete-agent-dialog";
import { getAgent } from "@/features/agents/queries";
import { StartChatButton } from "@/features/chat/components/start-chat-button";

// Depends on the caller's cookie-scoped auth session — must never be
// statically prerendered.
export const dynamic = "force-dynamic";

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
          <Link
            href={`/dashboard/knowledge/${agent.id}`}
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            <FileText /> Knowledge base
          </Link>
          <DeleteAgentDialog agentId={agent.id} agentName={agent.name} />
        </div>
      </div>
      <AgentForm agent={agent} />
    </div>
  );
}
