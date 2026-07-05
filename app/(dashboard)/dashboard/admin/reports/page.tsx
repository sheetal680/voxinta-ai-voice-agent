import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { PlatformReport } from "@/features/admin/components/platform-report";
import { getPlatformReport } from "@/features/admin/queries";

export const metadata: Metadata = { title: "Reports — Voxinta" };
export const dynamic = "force-dynamic";

export default async function AdminReportsPage() {
  const report = await getPlatformReport();

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
          <h1 className="text-xl font-semibold tracking-tight">Reports</h1>
          <p className="text-sm text-muted-foreground">A snapshot summary of platform activity.</p>
        </div>
      </div>

      {report ? (
        <PlatformReport report={report} />
      ) : (
        <p className="text-sm text-muted-foreground">Report unavailable.</p>
      )}
    </>
  );
}
