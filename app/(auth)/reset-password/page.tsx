import Link from "next/link";
import type { Metadata } from "next";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { createClient } from "@/lib/supabase/server";
import { ResetPasswordForm } from "./reset-password-form";

export const metadata: Metadata = { title: "Reset password — Voxinta" };

// Depends on the caller's cookie-scoped auth/recovery session — must never
// be statically prerendered.
export const dynamic = "force-dynamic";

export default async function ResetPasswordPage() {
  // Reaching this page (via the /auth/confirm recovery link) should have
  // already established a recovery session — verify it here rather than
  // trusting that the user arrived through the expected flow.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Set a new password</CardTitle>
        <CardDescription>Choose a new password for your account.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {user ? (
          <ResetPasswordForm />
        ) : (
          <>
            <Alert variant="destructive">
              <AlertDescription>
                This password reset link is invalid or has expired. Request a new one.
              </AlertDescription>
            </Alert>
            <p className="text-center text-sm text-muted-foreground">
              <Link
                href="/forgot-password"
                className="font-medium text-foreground underline underline-offset-4"
              >
                Request a new link
              </Link>
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
