import type { Metadata } from "next";
import { AgentForm } from "@/features/agents/components/agent-form";

export const metadata: Metadata = { title: "New agent — Voxinta" };

export default function NewAgentPage() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">New agent</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Configure your agent&apos;s prompt, personality, and voice.
        </p>
      </div>
      <AgentForm />
    </div>
  );
}
