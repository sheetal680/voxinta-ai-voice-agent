import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";

/**
 * Read-side data access for the Analytics dashboard. Both queries call SQL
 * functions (see supabase/migrations/20260704121000_analytics_functions.sql)
 * that aggregate directly from `conversations`/`messages` — real, always-
 * populated activity — rather than `usage_events`, which nothing in the app
 * writes to yet. RLS (via each function's own `owner_id = auth.uid() or
 * is_admin()` check) scopes every number to the caller, same as everywhere
 * else in the dashboard.
 */

export interface OverviewStats {
  totalConversations: number;
  totalMessages: number;
  totalUsers: number;
  avgResponseTimeMs: number | null;
}

const EMPTY_STATS: OverviewStats = {
  totalConversations: 0,
  totalMessages: 0,
  totalUsers: 0,
  avgResponseTimeMs: null,
};

export const getOverviewStats = cache(async (): Promise<OverviewStats> => {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("dashboard_overview_stats");

  if (error) {
    logger.error("analytics", "getOverviewStats failed", error);
    return EMPTY_STATS;
  }

  const row = data[0];
  if (!row) return EMPTY_STATS;

  return {
    totalConversations: Number(row.total_conversations),
    totalMessages: Number(row.total_messages),
    totalUsers: Number(row.total_users),
    avgResponseTimeMs: row.avg_response_time_ms === null ? null : Number(row.avg_response_time_ms),
  };
});

export type UsageGranularity = "day" | "week" | "month";

export interface UsagePoint {
  periodStart: string;
  conversationCount: number;
  messageCount: number;
}

export const getUsageOverTime = cache(
  async (granularity: UsageGranularity, periods: number): Promise<UsagePoint[]> => {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("usage_over_time", { granularity, periods });

    if (error) {
      logger.error("analytics", "getUsageOverTime failed", error);
      return [];
    }

    return data.map((row) => ({
      periodStart: row.period_start,
      conversationCount: Number(row.conversation_count),
      messageCount: Number(row.message_count),
    }));
  },
);
