import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime } from "@/features/chat/lib/format";
import type { DatabaseHealth, EnvHealthCheck, FailedDocumentSummary } from "../queries";

export function SystemHealth({
  envChecks,
  dbHealth,
  failedDocuments,
}: {
  envChecks: EnvHealthCheck[];
  dbHealth: DatabaseHealth;
  failedDocuments: FailedDocumentSummary[];
}) {
  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Database</CardTitle>
          <CardDescription>A round-trip query, timed, as a basic reachability check.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-2">
          {dbHealth.ok ? (
            <>
              <CheckCircle2 className="size-4 text-foreground" />
              <span className="text-sm">Reachable — {dbHealth.latencyMs}ms</span>
            </>
          ) : (
            <>
              <XCircle className="size-4 text-destructive" />
              <span className="text-sm text-destructive">{dbHealth.error ?? "Unreachable"}</span>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Configuration</CardTitle>
          <CardDescription>Which server-side providers have credentials configured.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {envChecks.map((check) => (
            <div key={check.label} className="flex items-center justify-between gap-4">
              <span className="text-sm">{check.label}</span>
              <Badge variant={check.configured ? "secondary" : "outline"} className="gap-1">
                {check.configured ? <CheckCircle2 className="size-3" /> : <XCircle className="size-3" />}
                {check.configured ? "Configured" : "Not set"}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent failures</CardTitle>
          <CardDescription>Knowledge-base documents that failed to process, across every user.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {failedDocuments.length === 0 ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="size-4" />
              No recent failures.
            </div>
          ) : (
            failedDocuments.map((doc) => (
              <div
                key={doc.id}
                className="flex flex-col gap-1 rounded-lg border border-border/50 bg-card/60 px-3 py-2.5"
              >
                <div className="flex items-center justify-between gap-4">
                  <span className="flex items-center gap-1.5 truncate text-sm font-medium">
                    <AlertTriangle className="size-3.5 shrink-0 text-destructive" />
                    {doc.filename}
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {formatDateTime(doc.updatedAt)}
                  </span>
                </div>
                {doc.error && <p className="text-xs text-destructive">{doc.error}</p>}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
