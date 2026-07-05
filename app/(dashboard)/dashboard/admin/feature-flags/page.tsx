import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { FeatureFlagsSection } from "@/features/admin/components/feature-flags-section";
import { getFeatureFlags } from "@/features/admin/queries";

export const metadata: Metadata = { title: "Feature Flags — Voxinta" };
export const dynamic = "force-dynamic";

export default async function AdminFeatureFlagsPage() {
  const flags = await getFeatureFlags();

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
          <h1 className="text-xl font-semibold tracking-tight">Feature Flags</h1>
          <p className="text-sm text-muted-foreground">Roll features out without a deploy.</p>
        </div>
      </div>

      <FeatureFlagsSection flags={flags} />
    </>
  );
}
