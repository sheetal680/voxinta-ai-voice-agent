import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/database";

/**
 * Refreshes the Supabase auth session on each request and forwards updated
 * cookies. Call from the root `middleware.ts`. Without this, Server Components
 * can end up with a stale/expired session.
 *
 * IMPORTANT: return `supabaseResponse` as-is (or copy its cookies onto any new
 * response) so the refreshed session cookies reach the browser.
 */
export async function updateSession(request: NextRequest): Promise<NextResponse> {
  let supabaseResponse = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // If env is not configured yet, don't block requests.
  if (!url || !anonKey) {
    return supabaseResponse;
  }

  const supabase = createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
      },
    },
  });

  // Touching the user refreshes the session if needed. Do not run logic
  // between createServerClient and getUser() (per Supabase guidance).
  await supabase.auth.getUser();

  return supabaseResponse;
}
