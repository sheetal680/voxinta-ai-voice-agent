import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Agent } from "@/types/database";

/**
 * Read-side data access for agents. Plain async functions (not Server
 * Actions) — called directly from Server Components. Row Level Security on
 * `agents` already scopes every query to the caller's own rows, so no
 * explicit `owner_id` filter is needed here.
 *
 * Wrapped in React's `cache()` so a page and its `generateMetadata` (which
 * both need the same agent) share one query per request instead of two.
 */

export const getAgents = cache(async (): Promise<Agent[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("agents")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[agents] getAgents failed:", error.message);
    return [];
  }

  return data;
});

export const getAgent = cache(async (id: string): Promise<Agent | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase.from("agents").select("*").eq("id", id).maybeSingle();

  if (error) {
    console.error("[agents] getAgent failed:", error.message);
    return null;
  }

  return data;
});
