import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

/**
 * Supabase client for use in Client Components (browser).
 *
 * Reads the public URL + anon key. Safe to expose — the anon key only grants
 * what Row Level Security allows. Create per-need; the SDK dedupes connections.
 */
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. " +
        "See .env.example.",
    );
  }

  return createBrowserClient<Database>(url, anonKey);
}
