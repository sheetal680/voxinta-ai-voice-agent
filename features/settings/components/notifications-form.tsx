"use client";

import { useState, useTransition } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { updateNotifications } from "../actions";
import { notificationsSchema, type NotificationsValues } from "../schemas";

const NOTIFICATION_ITEMS: { key: keyof NotificationsValues; label: string; description: string }[] = [
  {
    key: "emailNewConversation",
    label: "New conversations",
    description: "Get an email when a new conversation starts.",
  },
  {
    key: "emailWeeklySummary",
    label: "Weekly summary",
    description: "A weekly digest of conversations, messages, and response time.",
  },
  {
    key: "emailAgentErrors",
    label: "Agent errors",
    description: "Get notified if an agent fails to respond.",
  },
];

export function NotificationsForm({ initial }: { initial: Partial<NotificationsValues> | undefined }) {
  const defaults = notificationsSchema.parse(initial ?? {});
  const [values, setValues] = useState<NotificationsValues>(defaults);
  const [error, setError] = useState<string>();
  const [isPending, startTransition] = useTransition();

  function handleToggle(key: keyof NotificationsValues, checked: boolean) {
    setError(undefined);
    const next = { ...values, [key]: checked };
    setValues(next);
    startTransition(async () => {
      const result = await updateNotifications(next);
      if (!result.success) {
        setError(result.message ?? "Failed to update notifications.");
        setValues(values);
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notifications</CardTitle>
        <CardDescription>Choose what Voxinta emails you about.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {NOTIFICATION_ITEMS.map((item) => (
          <div key={item.key} className="flex items-center justify-between gap-4">
            <div>
              <Label htmlFor={`notif-${item.key}`}>{item.label}</Label>
              <p className="mt-0.5 text-xs text-muted-foreground">{item.description}</p>
            </div>
            <Switch
              id={`notif-${item.key}`}
              checked={values[item.key]}
              disabled={isPending}
              onCheckedChange={(checked) => handleToggle(item.key, checked)}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
