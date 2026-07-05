"use client";

import { useEffect } from "react";
import "./globals.css";

/**
 * Root-level error boundary — only fires when the root layout itself
 * throws, since it replaces `app/layout.tsx` entirely while active (per
 * Next.js: global-error must define its own <html>/<body>). Deliberately
 * minimal and dependency-light (no ThemeProvider/TooltipProvider, no
 * next/font) — this is the last line of defense, so it shouldn't have its
 * own way to fail. `suppressHydrationWarning` is unnecessary here since
 * there's no next-themes class to reconcile.
 */
export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error("[app] unhandled error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center bg-background p-6 text-foreground antialiased">
        <div className="flex flex-col items-center gap-3 text-center">
          <h1 className="text-lg font-semibold">Something went wrong</h1>
          <p className="max-w-sm text-sm text-muted-foreground">
            An unexpected error occurred. Please try again.
          </p>
          <button
            type="button"
            onClick={() => unstable_retry()}
            className="inline-flex h-8 items-center justify-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/80"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
