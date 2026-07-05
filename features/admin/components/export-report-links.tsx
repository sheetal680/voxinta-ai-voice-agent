import { Download } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ExportReportLinks() {
  return (
    <div className="flex items-center gap-1">
      <Download className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
      <a
        href="/api/admin/report/export?format=json"
        className={cn(buttonVariants({ variant: "ghost", size: "xs" }))}
      >
        JSON
      </a>
      <a
        href="/api/admin/report/export?format=csv"
        className={cn(buttonVariants({ variant: "ghost", size: "xs" }))}
      >
        CSV
      </a>
    </div>
  );
}
