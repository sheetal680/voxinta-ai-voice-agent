"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/error-state";

/** Error boundary for the marketing site (/). */
export default function LandingError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error("[landing] rendering error:", error);
  }, [error]);

  return (
    <ErrorState
      title="Something went wrong"
      description="This page hit an unexpected error. Try again in a moment."
      onRetry={unstable_retry}
    />
  );
}
