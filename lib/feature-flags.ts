import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";

/**
 * Runtime feature-flag checks, callable from any feature (not just the
 * admin panel that manages flags — see features/admin). Flags are readable
 * by every authenticated caller (see feature_flags' RLS); only admins can
 * change them.
 *
 * `cache()`-wrapped so multiple checks in one request share a single query
 * per flag rather than round-tripping to Postgres repeatedly.
 */
export const isFeatureEnabled = cache(async (key: string): Promise<boolean> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("feature_flags")
    .select("enabled")
    .eq("key", key)
    .maybeSingle();

  if (error) {
    logger.error("feature-flags", `Failed to read "${key}"`, error);
    return false;
  }
  // An unrecognized flag defaults to off rather than throwing — a flag that
  // hasn't been created yet should behave like "not rolled out", not break
  // whatever's checking it.
  return data?.enabled ?? false;
});
