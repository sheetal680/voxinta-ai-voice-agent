import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { API_KEY_PROVIDER_LABELS, API_KEY_PROVIDER_VALUES } from "../constants";
import type { ApiKeySummary } from "../queries";
import { ApiKeyRow } from "./api-key-row";

export function ApiKeysSection({ existingKeys }: { existingKeys: ApiKeySummary[] }) {
  const previewByProvider = new Map(existingKeys.map((key) => [key.provider, key.keyPreview]));

  return (
    <Card>
      <CardHeader>
        <CardTitle>API keys</CardTitle>
        <CardDescription>
          Bring your own provider keys. Encrypted at rest — once saved, a key is never shown again in
          full.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {API_KEY_PROVIDER_VALUES.map((provider) => (
          <ApiKeyRow
            key={provider}
            provider={provider}
            label={API_KEY_PROVIDER_LABELS[provider]}
            keyPreview={previewByProvider.get(provider)}
          />
        ))}
      </CardContent>
    </Card>
  );
}
