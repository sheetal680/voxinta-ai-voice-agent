import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { FeatureFlag } from "@/types/database";
import { FeatureFlagRow } from "./feature-flag-row";
import { NewFeatureFlagForm } from "./new-feature-flag-form";

export function FeatureFlagsSection({ flags }: { flags: FeatureFlag[] }) {
  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Add a flag</CardTitle>
          <CardDescription>Checked at runtime via lib/feature-flags.ts — off by default.</CardDescription>
        </CardHeader>
        <CardContent>
          <NewFeatureFlagForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Flags</CardTitle>
          <CardDescription>{flags.length} total.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {flags.length === 0 ? (
            <p className="text-sm text-muted-foreground">No feature flags yet.</p>
          ) : (
            flags.map((flag) => <FeatureFlagRow key={flag.id} flag={flag} />)
          )}
        </CardContent>
      </Card>
    </div>
  );
}
