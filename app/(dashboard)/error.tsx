"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/error-state";

/**
 * Error boundary for every /dashboard/** route (agents, chat, conversations,
 * analytics, knowledge, settings, admin, ...). Next.js requires this to be a
 * Client Component. `unstable_retry` (added in Next 16.2) re-renders just
 * this segment's children rather than a full page reload.
 */
export default function DashboardError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    // A rendering exception in a Client Component never reaches the server,
    // so lib/logger.ts's structured logging doesn't apply here — the
    // browser console (surfaced to Vercel's client-side error tracking, if
    // configured) is the right place for this one.
    console.error("[dashboard] rendering error:", error);
  }, [error]);

  return (
    <ErrorState
      title="This section hit a snag"
      description="Something went wrong loading this page. Try again, or use the sidebar to go elsewhere."
      onRetry={unstable_retry}
    />
  );
}
