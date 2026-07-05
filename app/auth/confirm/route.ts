import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";

/**
 * Mirrors Supabase auth-js's `EmailOtpType` (not re-exported from the
 * `@supabase/supabase-js` package entry, so it's redeclared locally rather
 * than reaching into a transitive dependency).
 */
type EmailOtpType = "signup" | "invite" | "magiclink" | "recovery" | "email_change" | "email";

/**
 * Handles Supabase email links (signup confirmation, password recovery,
 * email change, invite, magic link). The email templates in
 * `supabase/templates/` point here with `token_hash`, `type`, and `next`.
 *
 * GET /auth/confirm?token_hash=...&type=recovery&next=/reset-password
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const rawNext = searchParams.get("next") ?? "/dashboard";
  // Prevent open redirects: only ever land on a path within this app.
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/dashboard";

  try {
    if (tokenHash && type) {
      const supabase = await createClient();
      const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
      if (!error) {
        return NextResponse.redirect(new URL(next, origin));
      }
    }
  } catch (error) {
    // e.g. createClient() throwing when Supabase env vars are missing —
    // still land the browser somewhere sensible instead of a raw crash.
    logger.error("auth", "Unexpected failure confirming email link", error);
  }

  return NextResponse.redirect(new URL("/login?error=confirmation_failed", origin));
}
