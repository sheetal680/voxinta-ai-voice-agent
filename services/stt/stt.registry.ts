import type { STTProviderId } from "@/types";
import { getEnv } from "@/services/shared/env";
import { ProviderRegistry } from "@/services/shared/registry";
import type { ISTTProvider } from "./stt.interface";
import { BrowserSTTProvider } from "./providers/browser-stt.provider";

/**
 * Registry of available STT providers.
 *
 * To add a provider (e.g. a server-side Whisper API):
 *   1. add its id to `STTProviderId` in `types/stt.ts`,
 *   2. implement `ISTTProvider`,
 *   3. register it below.
 */
export const sttRegistry = new ProviderRegistry<STTProviderId, ISTTProvider>().register(
  "browser",
  () => new BrowserSTTProvider(),
);

/** Provider id used when `NEXT_PUBLIC_STT_PROVIDER` is unset. */
export const DEFAULT_STT_PROVIDER: STTProviderId = "browser";

/**
 * Resolve the active STT provider. `NEXT_PUBLIC_` prefix because STT
 * selection is needed client-side. A fresh instance is returned per call so
 * each voice session owns its own recognition state.
 */
export function getSTTProvider(id?: STTProviderId): ISTTProvider {
  const providerId =
    id ??
    (getEnv("NEXT_PUBLIC_STT_PROVIDER") as STTProviderId | undefined) ??
    DEFAULT_STT_PROVIDER;
  return sttRegistry.create(providerId);
}
