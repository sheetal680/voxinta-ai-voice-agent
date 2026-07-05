import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { SystemHealth } from "@/features/admin/components/system-health";
import { getDatabaseHealth, getEnvHealth, getRecentFailedDocuments } from "@/features/admin/queries";

export const metadata: Metadata = { title: "System Monitoring — Voxinta" };
export const dynamic = "force-dynamic";

export default async function AdminMonitoringPage() {
  const [dbHealth, failedDocuments] = await Promise.all([getDatabaseHealth(), getRecentFailedDocuments()]);
  const envChecks = getEnvHealth();

  return (
    <>
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/admin"
          className="text-muted-foreground transition-colors hover:text-foreground"
          aria-label="Back to admin"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">System Monitoring</h1>
          <p className="text-sm text-muted-foreground">Configuration health and recent failures.</p>
        </div>
      </div>

      <SystemHealth envChecks={envChecks} dbHealth={dbHealth} failedDocuments={failedDocuments} />
    </>
  );
}
