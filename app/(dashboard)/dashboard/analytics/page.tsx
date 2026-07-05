import type { Metadata } from "next";
import { BarChart3, MessagesSquare, Timer, TrendingUp, Users } from "lucide-react";

import { StatCard } from "@/features/analytics/components/stat-card";
import { UsagePanel } from "@/features/analytics/components/usage-panel";
import { formatCount, formatResponseTime } from "@/features/analytics/lib/format";
import { getOverviewStats, getUsageOverTime } from "@/features/analytics/queries";
import type { UsageGranularity, UsagePoint } from "@/features/analytics/queries";
import { EmptyState } from "../../_components/empty-state";

export const metadata: Metadata = { title: "Analytics — Voxinta" };

// Depends on the caller's cookie-scoped auth session — must never be
// statically prerendered.
export const dynamic = "force-dynamic";

const DAILY_PERIODS = 30;
const WEEKLY_PERIODS = 12;
const MONTHLY_PERIODS = 12;

export default async function AnalyticsPage() {
  const [stats, daily, weekly, monthly] = await Promise.all([
    getOverviewStats(),
    getUsageOverTime("day", DAILY_PERIODS),
    getUsageOverTime("week", WEEKLY_PERIODS),
    getUsageOverTime("month", MONTHLY_PERIODS),
  ]);

  const usageByGranularity: Record<UsageGranularity, UsagePoint[]> = {
    day: daily,
    week: weekly,
    month: monthly,
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Conversations, response time, and usage trends across your agents.
        </p>
      </div>

      {stats.totalConversations === 0 ? (
        <EmptyState
          icon={BarChart3}
          title="No data yet"
          description="Analytics will populate here once your agents start handling conversations."
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              icon={MessagesSquare}
              label="Conversations"
              value={formatCount(stats.totalConversations)}
            />
            <StatCard icon={Users} label="Users" value={formatCount(stats.totalUsers)} />
            <StatCard
              icon={Timer}
              label="Avg. response time"
              value={formatResponseTime(stats.avgResponseTimeMs)}
            />
            <StatCard icon={TrendingUp} label="Messages" value={formatCount(stats.totalMessages)} />
          </div>

          <UsagePanel usageByGranularity={usageByGranularity} />
        </>
      )}
    </div>
  );
}
