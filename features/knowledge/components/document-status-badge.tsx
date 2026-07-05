import { AlertCircle, Check, Clock, Loader2, type LucideIcon } from "lucide-react";

import { Badge, type badgeVariants } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { DocumentStatus } from "../constants";
import type { VariantProps } from "class-variance-authority";

const CONFIG: Record<
  DocumentStatus,
  { label: string; variant: VariantProps<typeof badgeVariants>["variant"]; icon: LucideIcon }
> = {
  pending: { label: "Pending", variant: "secondary", icon: Clock },
  processing: { label: "Processing", variant: "secondary", icon: Loader2 },
  ready: { label: "Ready", variant: "default", icon: Check },
  failed: { label: "Failed", variant: "destructive", icon: AlertCircle },
};

export function DocumentStatusBadge({ status }: { status: DocumentStatus }) {
  const config = CONFIG[status];
  const Icon = config.icon;

  return (
    <Badge variant={config.variant}>
      <Icon className={cn(status === "processing" && "animate-spin")} />
      {config.label}
    </Badge>
  );
}
