import type { Metadata } from "next";
import Link from "next/link";
import { Bot, Plus } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AgentCard } from "@/features/agents/components/agent-card";
import { getAgents } from "@/features/agents/queries";
import { EmptyState } from "../../_components/empty-state";

export const metadata: Metadata = { title: "AI Agents — Voxinta" };

// Depends on the caller's cookie-scoped auth session — must never be
// statically prerendered.
export const dynamic = "force-dynamic";

export default async function AgentsPage() {
  const agents = await getAgents();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">AI Agents</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Create and configure the agents that talk to your users.
          </p>
        </div>
        <Link href="/dashboard/agents/new" className={cn(buttonVariants())}>
          <Plus /> New agent
        </Link>
      </div>

      {agents.length === 0 ? (
        <EmptyState
          icon={Bot}
          title="No agents yet"
          description="Create your first agent — name, prompt, personality, and voice — to start handling conversations."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {agents.map((agent) => (
            <AgentCard key={agent.id} agent={agent} />
          ))}
        </div>
      )}
    </div>
  );
}
