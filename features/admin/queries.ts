import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import type { FeatureFlag } from "@/types/database";

/**
 * Read-side data access for /features/admin. The three RPCs
 * (admin_list_users, admin_list_conversations, admin_platform_report) each
 * raise a Postgres exception for a non-admin caller — the page-level gate
 * (app/(dashboard)/dashboard/admin/layout.tsx) is the primary defense, this
 * is the defense-in-depth layer, matching every other admin surface in
 * this app (see is_admin() usage throughout RLS policies).
 */

export const isCurrentUserAdmin = cache(async (): Promise<boolean> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  return data?.role === "admin";
});

export interface AdminUserSummary {
  id: string;
  email: string | null;
  fullName: string | null;
  avatarUrl: string | null;
  role: string;
  createdAt: string;
  agentCount: number;
  conversationCount: number;
}

export const getAdminUsers = cache(async (): Promise<AdminUserSummary[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_list_users");

  if (error) {
    logger.error("admin", "getAdminUsers failed", error);
    return [];
  }

  return data.map((row) => ({
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    avatarUrl: row.avatar_url,
    role: row.role,
    createdAt: row.created_at,
    agentCount: Number(row.agent_count),
    conversationCount: Number(row.conversation_count),
  }));
});

export interface AdminConversationSummary {
  id: string;
  title: string | null;
  ownerId: string;
  ownerEmail: string | null;
  agentId: string | null;
  agentName: string | null;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
}

export const getAdminConversations = cache(
  async (limit = 100): Promise<AdminConversationSummary[]> => {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("admin_list_conversations", { result_limit: limit });

    if (error) {
      logger.error("admin", "getAdminConversations failed", error);
      return [];
    }

    return data.map((row) => ({
      id: row.id,
      title: row.title,
      ownerId: row.owner_id,
      ownerEmail: row.owner_email,
      agentId: row.agent_id,
      agentName: row.agent_name,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      messageCount: Number(row.message_count),
    }));
  },
);

export interface PlatformReport {
  totalUsers: number;
  totalAgents: number;
  totalConversations: number;
  totalMessages: number;
  totalToolCalls: number;
  avgResponseTimeMs: number | null;
  totalDocuments: number;
  failedDocuments: number;
}

export const getPlatformReport = cache(async (): Promise<PlatformReport | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_platform_report");

  if (error) {
    logger.error("admin", "getPlatformReport failed", error);
    return null;
  }

  const row = data[0];
  if (!row) return null;

  return {
    totalUsers: Number(row.total_users),
    totalAgents: Number(row.total_agents),
    totalConversations: Number(row.total_conversations),
    totalMessages: Number(row.total_messages),
    totalToolCalls: Number(row.total_tool_calls),
    avgResponseTimeMs: row.avg_response_time_ms === null ? null : Number(row.avg_response_time_ms),
    totalDocuments: Number(row.total_documents),
    failedDocuments: Number(row.failed_documents),
  };
});

export interface FailedDocumentSummary {
  id: string;
  filename: string;
  ownerId: string;
  error: string | null;
  updatedAt: string;
}

/**
 * Recent failed knowledge-base uploads across every user — real, already-
 * stored error data (features/knowledge/actions.ts records `error` on
 * failure) rather than a dedicated error-log table nothing writes to yet.
 * Relies on knowledge_documents' existing RLS admin bypass, so no new
 * function is needed for this one.
 */
export const getRecentFailedDocuments = cache(async (limit = 20): Promise<FailedDocumentSummary[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("knowledge_documents")
    .select("id, filename, owner_id, error, updated_at")
    .eq("status", "failed")
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (error) {
    logger.error("admin", "getRecentFailedDocuments failed", error);
    return [];
  }

  return data.map((row) => ({
    id: row.id,
    filename: row.filename,
    ownerId: row.owner_id,
    error: row.error,
    updatedAt: row.updated_at,
  }));
});

export interface DatabaseHealth {
  ok: boolean;
  latencyMs: number;
  error?: string;
}

/** A trivial round-trip query, timed, as a basic "is the database reachable and responsive" check. */
export async function getDatabaseHealth(): Promise<DatabaseHealth> {
  const supabase = await createClient();
  const startedAt = Date.now();
  const { error } = await supabase.from("profiles").select("id", { count: "exact", head: true });
  const latencyMs = Date.now() - startedAt;

  if (error) {
    return { ok: false, latencyMs, error: error.message };
  }
  return { ok: true, latencyMs };
}

export interface EnvHealthCheck {
  label: string;
  configured: boolean;
}

/** Presence-only checks — never reads or exposes the actual secret values. */
export function getEnvHealth(): EnvHealthCheck[] {
  return [
    { label: "Supabase URL", configured: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) },
    { label: "Supabase anon key", configured: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) },
    { label: "Supabase service role key", configured: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY) },
    { label: "Groq API key (LLM)", configured: Boolean(process.env.GROQ_API_KEY) },
    { label: "OpenAI API key (embeddings)", configured: Boolean(process.env.OPENAI_API_KEY) },
    {
      label: "API key encryption secret",
      configured: Boolean(process.env.API_KEY_ENCRYPTION_SECRET),
    },
  ];
}

export const getFeatureFlags = cache(async (): Promise<FeatureFlag[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase.from("feature_flags").select("*").order("key", { ascending: true });

  if (error) {
    logger.error("admin", "getFeatureFlags failed", error);
    return [];
  }
  return data;
});
