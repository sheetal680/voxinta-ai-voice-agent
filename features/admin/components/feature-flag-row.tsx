"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { deleteFeatureFlag, toggleFeatureFlag } from "../actions";
import type { FeatureFlag } from "@/types/database";

export function FeatureFlagRow({ flag }: { flag: FeatureFlag }) {
  const router = useRouter();
  const [error, setError] = useState<string>();
  const [isPending, startTransition] = useTransition();

  function handleToggle(enabled: boolean) {
    setError(undefined);
    startTransition(async () => {
      const result = await toggleFeatureFlag({ id: flag.id, enabled });
      if (!result.success) {
        setError(result.message ?? "Failed to update flag.");
        return;
      }
      router.refresh();
    });
  }

  function handleDelete() {
    setError(undefined);
    startTransition(async () => {
      const result = await deleteFeatureFlag(flag.id);
      if (!result.success) {
        setError(result.message ?? "Failed to delete flag.");
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-1 rounded-lg border border-border/50 bg-card/60 px-3 py-2.5">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate font-mono text-sm font-medium">{flag.key}</p>
          {flag.description && <p className="text-xs text-muted-foreground">{flag.description}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Switch checked={flag.enabled} disabled={isPending} onCheckedChange={handleToggle} />
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={`Delete ${flag.key} flag`}
            disabled={isPending}
            onClick={handleDelete}
          >
            <Trash2 />
          </Button>
        </div>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
