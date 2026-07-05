"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { UsageGranularity, UsagePoint } from "../queries";
import { UsageChart } from "./usage-chart";

const GRANULARITY_OPTIONS: { value: UsageGranularity; label: string }[] = [
  { value: "day", label: "Daily" },
  { value: "week", label: "Weekly" },
  { value: "month", label: "Monthly" },
];

export function UsagePanel({
  usageByGranularity,
}: {
  usageByGranularity: Record<UsageGranularity, UsagePoint[]>;
}) {
  const [granularity, setGranularity] = useState<UsageGranularity>("day");

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>Usage over time</CardTitle>
        <div
          role="group"
          aria-label="Usage granularity"
          className="flex items-center gap-1 rounded-lg bg-muted p-0.5"
        >
          {GRANULARITY_OPTIONS.map((option) => (
            <Button
              key={option.value}
              type="button"
              size="sm"
              variant="ghost"
              aria-pressed={granularity === option.value}
              className={cn(
                "h-6.5 px-2.5 text-xs",
                granularity === option.value && "bg-card shadow-xs",
              )}
              onClick={() => setGranularity(option.value)}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <UsageChart data={usageByGranularity[granularity]} granularity={granularity} />
      </CardContent>
    </Card>
  );
}
