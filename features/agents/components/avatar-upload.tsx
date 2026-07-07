"use client";

import { useRef, useState, useTransition } from "react";
import { Camera, Loader2 } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { updateAgentAvatar, uploadAgentAvatar } from "../actions";
import { AVATAR_ALLOWED_MIME_TYPES, AVATAR_MAX_SIZE_BYTES } from "../constants";

function initialsFrom(agentName: string): string {
  return agentName.trim().slice(0, 2).toUpperCase() || "AI";
}

export function AvatarUpload({
  agentId,
  agentName,
  value,
  onChange,
}: {
  /** Omitted while creating a new agent — there's no row yet to persist to. */
  agentId?: string;
  agentName: string;
  value?: string;
  onChange: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string>();
  const [isPending, startTransition] = useTransition();

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    // Allow re-selecting the same file (e.g. after fixing a rejected upload).
    event.target.value = "";
    if (!file) return;

    setError(undefined);

    if (!(AVATAR_ALLOWED_MIME_TYPES as readonly string[]).includes(file.type)) {
      setError("Avatar must be a PNG, JPEG, WebP, or GIF image.");
      return;
    }
    if (file.size > AVATAR_MAX_SIZE_BYTES) {
      setError("Avatar must be 2MB or smaller.");
      return;
    }

    const formData = new FormData();
    formData.set("file", file);

    startTransition(async () => {
      const result = await uploadAgentAvatar(formData);
      if (!result.success || !result.data) {
        setError(result.message ?? "Upload failed. Please try again.");
        return;
      }
      onChange(result.data.url);

      if (agentId) {
        const saveResult = await updateAgentAvatar(agentId, result.data.url);
        if (!saveResult.success) {
          setError(saveResult.message ?? "Upload saved, but failed to persist. Please try again.");
        }
      }
    });
  }

  return (
    <div className="flex items-center gap-4">
      <Avatar size="lg">
        <AvatarImage src={value} alt="" />
        <AvatarFallback>{initialsFrom(agentName)}</AvatarFallback>
      </Avatar>

      <div className="flex flex-col gap-1.5">
        <input
          ref={inputRef}
          type="file"
          accept={AVATAR_ALLOWED_MIME_TYPES.join(",")}
          className="hidden"
          onChange={handleFileChange}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isPending}
          onClick={() => inputRef.current?.click()}
        >
          {isPending ? (
            <>
              <Loader2 className="animate-spin" /> Uploading…
            </>
          ) : (
            <>
              <Camera /> {value ? "Change photo" : "Upload photo"}
            </>
          )}
        </Button>
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    </div>
  );
}
