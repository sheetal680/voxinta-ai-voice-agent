import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/database";

/** Route prefixes that require an authenticated user. */
const PROTECTED_PREFIXES = ["/dashboard"];

/** Pages a logged-in user shouldn't see — sending them to the dashboard instead. */
const LOGGED_OUT_ONLY_PATHS = ["/login", "/signup", "/forgot-password"];

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function isLoggedOutOnlyPath(pathname: string): boolean {
  return LOGGED_OUT_ONLY_PATHS.includes(pathname);
}

/** Carry cookies set on `from` (e.g. a refreshed session) onto a new response. */
function copyCookies(from: NextResponse, to: NextResponse): NextResponse {
  from.cookies.getAll().forEach((cookie) => to.cookies.set(cookie));
  return to;
}

/**
 * Refreshes the Supabase auth session on every request and enforces coarse
 * route protection: unauthenticated users are bounced off `/dashboard/**`,
 * and authenticated users are bounced off the logged-out-only auth pages.
 *
 * This is an *optimistic* check (see Next.js Proxy guidance) — it keeps
 * unauthenticated users out of protected UI quickly, but it is not the only
 * line of defense. Each protected layout/Server Action re-checks the session
 * itself (see app/(dashboard)/layout.tsx and lib/auth/actions.ts), since a
 * Proxy matcher change could otherwise silently remove this coverage.
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

  // getUser() revalidates against the Supabase Auth server (unlike getSession(),
  // which only trusts the cookie) — required for a real authorization check.
  // Do not run logic between createServerClient and getUser().
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname, search } = request.nextUrl;

  if (!user && isProtectedPath(pathname)) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirectTo", `${pathname}${search}`);
    return copyCookies(supabaseResponse, NextResponse.redirect(loginUrl));
  }

  if (user && isLoggedOutOnlyPath(pathname)) {
    return copyCookies(supabaseResponse, NextResponse.redirect(new URL("/dashboard", request.url)));
  }

  return supabaseResponse;
}
