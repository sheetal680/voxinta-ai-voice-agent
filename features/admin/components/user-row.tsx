"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShieldCheck } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { updateUserRole } from "../actions";
import type { AdminUserSummary } from "../queries";

function initialsFrom(name: string): string {
  return name.trim().slice(0, 2).toUpperCase() || "U";
}

export function UserRow({
  user,
  isSelf,
}: {
  user: AdminUserSummary;
  isSelf: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState<string>();
  const [isPending, startTransition] = useTransition();

  function handleToggleRole() {
    setError(undefined);
    const nextRole = user.role === "admin" ? "user" : "admin";
    startTransition(async () => {
      const result = await updateUserRole({ userId: user.id, role: nextRole });
      if (!result.success) {
        setError(result.message ?? "Failed to update role.");
        return;
      }
      router.refresh();
    });
  }

  const displayName = user.fullName || user.email || "Unknown";

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border/50 bg-card/60 px-3 py-2.5">
      <Avatar size="sm" className="shrink-0">
        <AvatarImage src={user.avatarUrl ?? undefined} alt="" />
        <AvatarFallback>{initialsFrom(displayName)}</AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{displayName}</p>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
          <span>{user.email}</span>
          <span aria-hidden>·</span>
          <span>{user.agentCount} agents</span>
          <span aria-hidden>·</span>
          <span>{user.conversationCount} conversations</span>
        </div>
        {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
      </div>

      {user.role === "admin" && (
        <Badge variant="secondary" className="shrink-0 gap-1">
          <ShieldCheck className="size-3" /> Admin
        </Badge>
      )}

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="shrink-0"
        disabled={isPending || isSelf}
        title={isSelf ? "You can't change your own role." : undefined}
        onClick={handleToggleRole}
      >
        {isPending ? (
          <Loader2 className="animate-spin" />
        ) : user.role === "admin" ? (
          "Demote to user"
        ) : (
          "Promote to admin"
        )}
      </Button>
    </div>
  );
}
