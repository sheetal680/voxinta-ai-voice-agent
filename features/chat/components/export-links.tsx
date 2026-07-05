import { Download } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * A pair of download links (JSON/CSV) against GET /api/conversations/export.
 * Plain `<a>` tags rather than client-side fetch+Blob — the route already
 * sends a real Content-Disposition response, so a normal navigation is all
 * a download needs.
 */
function exportHref(queryString: string, format: "json" | "csv"): string {
  const prefix = queryString ? `${queryString}&` : "";
  return `/api/conversations/export?${prefix}format=${format}`;
}

export function ExportLinks({ queryString }: { queryString: string }) {
  return (
    <div className="flex items-center gap-1">
      <Download className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
      <a href={exportHref(queryString, "json")} className={cn(buttonVariants({ variant: "ghost", size: "xs" }))}>
        JSON
      </a>
      <a href={exportHref(queryString, "csv")} className={cn(buttonVariants({ variant: "ghost", size: "xs" }))}>
        CSV
      </a>
    </div>
  );
}
