import type { Metadata } from "next";
import { Plug } from "lucide-react";
import { EmptyState } from "../../_components/empty-state";

export const metadata: Metadata = { title: "Integrations — Voxinta" };

export default function IntegrationsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Integrations</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Connect tools — calendars, web search, custom APIs — to your agents.
        </p>
      </div>

      <EmptyState
        icon={Plug}
        title="No integrations connected"
        description="Enable a tool like calculator, web search, or calendar to extend what your agents can do."
      />
    </div>
  );
}
