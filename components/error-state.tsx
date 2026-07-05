import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Shared fallback UI for route-segment error boundaries (see the
 * error.tsx files in each top-level route group). Visually mirrors
 * app/(dashboard)/_components/empty-state.tsx (icon in a circle, title,
 * description) so an error state reads as part of the same design
 * language as an empty state, not a jarring one-off.
 */
export function ErrorState({
  title = "Something went wrong",
  description = "An unexpected error occurred. You can try again, or come back later.",
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry: () => void;
}) {
  return (
    <div
      role="alert"
      className="flex min-h-[50vh] flex-col items-center justify-center gap-3 px-6 py-24 text-center"
    >
      <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <AlertTriangle className="size-6" />
      </div>
      <div>
        <h2 className="text-base font-semibold">{title}</h2>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      </div>
      <Button type="button" onClick={onRetry}>
        Try again
      </Button>
    </div>
  );
}
