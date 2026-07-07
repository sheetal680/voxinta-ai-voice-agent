"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Wrench } from "lucide-react";

import { Switch } from "@/components/ui/switch";
import { setToolEnabled } from "../actions";
import { humanizeToolName } from "../lib/format";
import type { ToolConfigSummary } from "../queries";

export function ToolToggleRow({ agentId, tool }: { agentId: string; tool: ToolConfigSummary }) {
  const router = useRouter();
  const [enabled, setEnabled] = useState(tool.enabled);
  const [error, setError] = useState<string>();
  const [isPending, startTransition] = useTransition();

  function handleToggle(next: boolean) {
    setError(undefined);
    setEnabled(next);
    startTransition(async () => {
      const result = await setToolEnabled({ agentId, toolName: tool.name, enabled: next });
      if (!result.success) {
        setEnabled(!next);
        setError(result.message ?? "Failed to update this tool.");
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-1 rounded-lg border border-border/50 bg-card/60 px-3 py-2.5">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
            <Wrench className="size-4" />
          </div>
          <div>
            <p className="text-sm font-medium">{humanizeToolName(tool.name)}</p>
            <p className="text-xs text-muted-foreground">{tool.description}</p>
          </div>
        </div>
        <Switch checked={enabled} disabled={isPending} onCheckedChange={handleToggle} />
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
