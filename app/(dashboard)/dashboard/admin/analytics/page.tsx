import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, MessagesSquare, Timer, TrendingUp, Users } from "lucide-react";

import { StatCard } from "@/features/analytics/components/stat-card";
import { UsagePanel } from "@/features/analytics/components/usage-panel";
import { formatCount, formatResponseTime } from "@/features/analytics/lib/format";
import { getOverviewStats, getUsageOverTime } from "@/features/analytics/queries";
import type { UsageGranularity, UsagePoint } from "@/features/analytics/queries";

export const metadata: Metadata = { title: "Admin Analytics — Voxinta" };
export const dynamic = "force-dynamic";

const DAILY_PERIODS = 30;
const WEEKLY_PERIODS = 12;
const MONTHLY_PERIODS = 12;

/**
 * Reuses features/analytics' existing stats/usage RPCs as-is — both already
 * scope to `owner_id = auth.uid() or is_admin()`, so calling them from an
 * admin session (this route is behind the admin layout's gate) returns
 * platform-wide totals automatically, with zero new SQL needed.
 */
export default async function AdminAnalyticsPage() {
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
    <>
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/admin"
          className="text-muted-foreground transition-colors hover:text-foreground"
          aria-label="Back to admin"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Analytics</h1>
          <p className="text-sm text-muted-foreground">Platform-wide, across every user.</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={MessagesSquare} label="Conversations" value={formatCount(stats.totalConversations)} />
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
  );
}
