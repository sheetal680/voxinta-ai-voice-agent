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
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Log in — Voxinta" };

const ERROR_MESSAGES: Record<string, string> = {
  confirmation_failed: "That confirmation link is invalid or has expired.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirectTo?: string; error?: string; reset?: string }>;
}) {
  const { redirectTo, error, reset } = await searchParams;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Log in</CardTitle>
        <CardDescription>Welcome back. Sign in to continue to your agents.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {reset === "success" && (
          <Alert>
            <AlertDescription>Your password was updated. Sign in below.</AlertDescription>
          </Alert>
        )}
        {error && ERROR_MESSAGES[error] && (
          <Alert variant="destructive">
            <AlertDescription>{ERROR_MESSAGES[error]}</AlertDescription>
          </Alert>
        )}

        <LoginForm redirectTo={redirectTo} />

        <p className="text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-medium text-foreground underline underline-offset-4">
            Sign up
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
