import type { UsageGranularity } from "../queries";

const dayFormatter = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });
const monthFormatter = new Intl.DateTimeFormat("en-US", { month: "short", year: "2-digit" });

/** Short x-axis label for a bucket's start date, shaped by its granularity. */
export function formatPeriodLabel(iso: string, granularity: UsageGranularity): string {
  const date = new Date(iso);
  if (granularity === "month") return monthFormatter.format(date);
  return dayFormatter.format(date);
}

export function formatResponseTime(ms: number | null): string {
  if (ms === null) return "—";
  return ms < 1000 ? `${Math.round(ms)}ms` : `${(ms / 1000).toFixed(1)}s`;
}

export function formatCount(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}
