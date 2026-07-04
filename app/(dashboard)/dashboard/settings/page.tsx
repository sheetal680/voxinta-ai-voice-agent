import type { Metadata } from "next";
import { Settings } from "lucide-react";
import { EmptyState } from "../../_components/empty-state";

export const metadata: Metadata = { title: "Settings — Voxinta" };

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Profile, theme, AI defaults, API keys, and notification preferences.
        </p>
      </div>

      <EmptyState
        icon={Settings}
        title="Settings coming soon"
        description="Profile, theme, and notification preferences will be configurable here."
      />
    </div>
  );
}
