import type { Metadata } from "next";
import { Plug } from "lucide-react";

import { AgentCard } from "@/features/agents/components/agent-card";
import { getAgents } from "@/features/agents/queries";
import { EmptyState } from "../../_components/empty-state";

export const metadata: Metadata = { title: "Integrations — Voxinta" };

// Depends on the caller's cookie-scoped auth session — must never be
// statically prerendered.
export const dynamic = "force-dynamic";

export default async function IntegrationsPage() {
  const agents = await getAgents();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Integrations</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Tools are scoped per agent — pick an agent below to enable or disable what it can call.
        </p>
      </div>

      {agents.length === 0 ? (
        <EmptyState
          icon={Plug}
          title="No agents yet"
          description="Create an agent first, then enable tools like calculator, weather, or web search from its page."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {agents.map((agent) => (
            <AgentCard key={agent.id} agent={agent} href={`/dashboard/integrations/${agent.id}`} />
          ))}
        </div>
      )}
    </div>
  );
}
