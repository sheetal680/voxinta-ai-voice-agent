import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import type { Profile } from "@/types/database";

/**
 * Read-side data access for /features/settings. Plain async functions (not
 * Server Actions) — called directly from Server Components. RLS scopes
 * both tables to the caller, so no explicit owner filter is needed beyond
 * `auth.uid()` for profiles (a single row lookup) and the RLS policy on
 * user_api_keys (owner-only, no admin bypass — see the migration).
 */

export const getProfile = cache(async (): Promise<Profile | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();

  if (error) {
    logger.error("settings", "getProfile failed", error);
    return null;
  }
  return data;
});

export interface ApiKeySummary {
  provider: string;
  keyPreview: string;
  updatedAt: string;
}

/** Never returns `encrypted_key` — only enough to show "a key is on file, ending in ####". */
export const getApiKeys = cache(async (): Promise<ApiKeySummary[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_api_keys")
    .select("provider, key_preview, updated_at")
    .order("provider", { ascending: true });

  if (error) {
    logger.error("settings", "getApiKeys failed", error);
    return [];
  }

  return data.map((row) => ({
    provider: row.provider,
    keyPreview: row.key_preview,
    updatedAt: row.updated_at,
  }));
});
