import type { Metadata } from "next";
import { Gauge } from "lucide-react";
import { EmptyState } from "../../_components/empty-state";

export const metadata: Metadata = { title: "Usage — Voxinta" };

export default function UsagePage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Usage</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Track your plan&apos;s voice minutes and message volume.
        </p>
      </div>

      <EmptyState
        icon={Gauge}
        title="No usage yet"
        description="Voice minutes and message counts will show up here as your agents are used."
      />
    </div>
  );
}
