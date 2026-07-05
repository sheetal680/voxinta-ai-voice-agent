"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { UsageGranularity, UsagePoint } from "../queries";
import { formatCount, formatPeriodLabel } from "../lib/format";

/**
 * Series colors deliberately use `--color-foreground`/`--color-muted-foreground`
 * rather than `--color-chart-1`/`--color-chart-2`: this theme's chart tokens
 * are a flat grayscale ramp that doesn't invert between light/dark mode, so
 * chart-1 (a light gray) is nearly invisible against a light-mode card.
 * foreground/muted-foreground are the tokens this theme already designed to
 * stay high-contrast against the card background in both modes.
 */
export function UsageChart({
  data,
  granularity,
}: {
  data: UsagePoint[];
  granularity: UsageGranularity;
}) {
  const chartData = data.map((point) => ({
    ...point,
    label: formatPeriodLabel(point.periodStart, granularity),
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="usage-conversations" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-foreground)" stopOpacity={0.35} />
            <stop offset="95%" stopColor="var(--color-foreground)" stopOpacity={0.02} />
          </linearGradient>
          <linearGradient id="usage-messages" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-muted-foreground)" stopOpacity={0.35} />
            <stop offset="95%" stopColor="var(--color-muted-foreground)" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }}
          axisLine={{ stroke: "var(--color-border)" }}
          tickLine={false}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          width={32}
        />
        <Tooltip
          formatter={(value) => formatCount(Number(value))}
          contentStyle={{
            background: "var(--color-popover)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-lg)",
            fontSize: 12,
          }}
          labelStyle={{ color: "var(--color-foreground)" }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Area
          type="monotone"
          dataKey="conversationCount"
          name="Conversations"
          stroke="var(--color-foreground)"
          fill="url(#usage-conversations)"
          strokeWidth={2}
        />
        <Area
          type="monotone"
          dataKey="messageCount"
          name="Messages"
          stroke="var(--color-muted-foreground)"
          fill="url(#usage-messages)"
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
