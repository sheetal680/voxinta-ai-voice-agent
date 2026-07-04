import type { Metadata } from "next";
import { BarChart3 } from "lucide-react";
import { EmptyState } from "../../_components/empty-state";

export const metadata: Metadata = { title: "Analytics — Voxinta" };

export default function AnalyticsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Conversations, response time, and usage trends across your agents.
        </p>
      </div>

      <EmptyState
        icon={BarChart3}
        title="No data yet"
        description="Analytics will populate here once your agents start handling conversations."
      />
    </div>
  );
}
