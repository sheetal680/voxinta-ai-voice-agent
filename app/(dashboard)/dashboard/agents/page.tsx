import type { Metadata } from "next";
import { Bot } from "lucide-react";
import { EmptyState } from "../../_components/empty-state";

export const metadata: Metadata = { title: "AI Agents — Voxinta" };

export default function AgentsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">AI Agents</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Create and configure the agents that talk to your users.
        </p>
      </div>

      <EmptyState
        icon={Bot}
        title="No agents yet"
        description="Create your first agent — name, prompt, personality, and voice — to start handling conversations."
      />
    </div>
  );
}
