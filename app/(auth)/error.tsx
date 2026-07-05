"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/error-state";

/** Error boundary for /login, /signup, /forgot-password, /reset-password. */
export default function AuthError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error("[auth] rendering error:", error);
  }, [error]);

  return (
    <ErrorState
      title="Something went wrong"
      description="This page hit an unexpected error. Try again, or refresh the page."
      onRetry={unstable_retry}
    />
  );
}
