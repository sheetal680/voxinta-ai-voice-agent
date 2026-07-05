"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Loader2, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { deleteApiKey, saveApiKey } from "../actions";
import type { ApiKeyProvider } from "../constants";
import { apiKeyFormSchema } from "../schemas";

export function ApiKeyRow({
  provider,
  label,
  keyPreview,
}: {
  provider: ApiKeyProvider;
  label: string;
  keyPreview: string | undefined;
}) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [error, setError] = useState<string>();
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    setError(undefined);
    const parsed = apiKeyFormSchema.safeParse({ provider, apiKey: inputValue });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid API key.");
      return;
    }
    startTransition(async () => {
      const result = await saveApiKey(parsed.data);
      if (!result.success) {
        setError(result.message ?? "Failed to save API key.");
        return;
      }
      setIsEditing(false);
      setInputValue("");
      router.refresh();
    });
  }

  function handleDelete() {
    setError(undefined);
    startTransition(async () => {
      const result = await deleteApiKey(provider);
      if (!result.success) {
        setError(result.message ?? "Failed to remove API key.");
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border/50 bg-card/60 px-3 py-2.5">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <KeyRound className="size-4 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">{label}</p>
            <p className="text-xs text-muted-foreground">
              {keyPreview ? `Key on file, ending in ${keyPreview}` : "No key set"}
            </p>
          </div>
        </div>

        {!isEditing && (
          <div className="flex items-center gap-1">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsEditing(true)}>
              {keyPreview ? "Replace" : "Add key"}
            </Button>
            {keyPreview && (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={`Remove ${label} API key`}
                onClick={handleDelete}
                disabled={isPending}
              >
                <Trash2 />
              </Button>
            )}
          </div>
        )}
      </div>

      {isEditing && (
        <div className="flex items-center gap-2">
          <Input
            type="password"
            placeholder={`${label} API key`}
            aria-label={`${label} API key`}
            value={inputValue}
            onChange={(event) => setInputValue(event.target.value)}
            autoComplete="off"
          />
          <Button type="button" size="sm" onClick={handleSave} disabled={isPending}>
            {isPending ? <Loader2 className="animate-spin" /> : "Save"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setIsEditing(false);
              setInputValue("");
              setError(undefined);
            }}
            disabled={isPending}
          >
            Cancel
          </Button>
        </div>
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
