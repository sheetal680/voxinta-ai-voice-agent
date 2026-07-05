"use client";

import { useRef, useState, useTransition } from "react";
import { Camera, Loader2 } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { AVATAR_ALLOWED_MIME_TYPES, AVATAR_MAX_SIZE_BYTES } from "../constants";
import { uploadProfileAvatar } from "../actions";

function initialsFrom(name: string): string {
  return name.trim().slice(0, 2).toUpperCase() || "U";
}

export function ProfileAvatarUpload({
  displayName,
  value,
  onChange,
}: {
  displayName: string;
  value?: string;
  onChange: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string>();
  const [isPending, startTransition] = useTransition();

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
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
      const result = await uploadProfileAvatar(formData);
      if (!result.success || !result.data) {
        setError(result.message ?? "Upload failed. Please try again.");
        return;
      }
      onChange(result.data.url);
    });
  }

  return (
    <div className="flex items-center gap-4">
      <Avatar size="lg">
        <AvatarImage src={value} alt="" />
        <AvatarFallback>{initialsFrom(displayName)}</AvatarFallback>
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
          className="w-fit"
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
