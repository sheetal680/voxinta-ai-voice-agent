"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { fieldErrorsFromZodError, type ActionResult } from "@/lib/action-result";
import { logger } from "@/lib/logger";
import {
  forgotPasswordSchema,
  loginSchema,
  resetPasswordSchema,
  signupSchema,
  type ForgotPasswordInput,
  type LoginInput,
  type ResetPasswordInput,
  type SignupInput,
} from "./schemas";

/**
 * Server Actions backing the /(auth) forms. Each action re-validates its
 * input with the same Zod schema the client used (never trust `FormData`/
 * client state — see CLAUDE.md: "Zod validation on all inputs"), then talks
 * to Supabase Auth through the cookie-bound server client so the session
 * lands in the browser correctly.
 *
 * These actions return a plain result and let the calling Client Component
 * navigate on success (via `useRouter()`), rather than calling `redirect()`
 * themselves. `redirect()` throws a control-flow signal that's only safe to
 * rely on when the action is invoked through `<form action={...}>` — direct
 * calls from an event handler (as React Hook Form's `onSubmit` does) need
 * `startTransition`, which doesn't compose cleanly with RHF's own submitting
 * state. `signOut` is the exception: it's wired to a plain `<form action=
 * {signOut}>` button, so its `redirect()` is safe.
 */

/** Absolute site origin, used to build links Supabase emails redirect back to. */
function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

export async function login(input: LoginInput): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      message: "Please fix the errors below.",
      fieldErrors: fieldErrorsFromZodError(parsed.error),
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return { success: false, message: error.message };
  }

  return { success: true };
}

export async function signup(input: SignupInput): Promise<ActionResult> {
  const parsed = signupSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      message: "Please fix the errors below.",
      fieldErrors: fieldErrorsFromZodError(parsed.error),
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.fullName },
      // Becomes {{ .RedirectTo }} in the confirmation email template, which
      // links to /auth/confirm?...&next={{ .RedirectTo }}.
      emailRedirectTo: `${getSiteUrl()}/dashboard`,
    },
  });

  if (error) {
    return { success: false, message: error.message };
  }

  return {
    success: true,
    message: "Check your email to confirm your account before signing in.",
  };
}

export async function requestPasswordReset(input: ForgotPasswordInput): Promise<ActionResult> {
  const parsed = forgotPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      message: "Please fix the errors below.",
      fieldErrors: fieldErrorsFromZodError(parsed.error),
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${getSiteUrl()}/reset-password`,
  });

  if (error) {
    // Log server-side for diagnostics, but never leak provider details to the
    // client — doing so (or varying the message) would let callers enumerate
    // which emails have accounts.
    logger.error("auth", "resetPasswordForEmail failed", error);
  }

  return {
    success: true,
    message: "If an account exists for that email, we've sent a password reset link.",
  };
}

export async function resetPassword(input: ResetPasswordInput): Promise<ActionResult> {
  const parsed = resetPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      message: "Please fix the errors below.",
      fieldErrors: fieldErrorsFromZodError(parsed.error),
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      message: "This password reset link is invalid or has expired. Request a new one.",
    };
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    return { success: false, message: error.message };
  }

  // Sign out of the recovery session so the user re-authenticates with their
  // new password, rather than silently inheriting a session from the reset link.
  await supabase.auth.signOut();
  return { success: true, message: "Password updated. Sign in with your new password." };
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
