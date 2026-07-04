import type { TTSProviderId } from "@/types";
import { getEnv } from "@/services/shared/env";
import { ProviderRegistry } from "@/services/shared/registry";
import type { ITTSProvider } from "./tts.interface";
import { BrowserTTSProvider } from "./providers/browser-tts.provider";

/**
 * Registry of available TTS providers.
 *
 * To add a provider (ElevenLabs, OpenAI TTS, Piper):
 *   1. add its id to `TTSProviderId` in `types/tts.ts`,
 *   2. implement `ITTSProvider`,
 *   3. register it below.
 */
export const ttsRegistry = new ProviderRegistry<TTSProviderId, ITTSProvider>().register(
  "browser",
  () => new BrowserTTSProvider(),
);

/** Provider id used when `NEXT_PUBLIC_TTS_PROVIDER` is unset. */
export const DEFAULT_TTS_PROVIDER: TTSProviderId = "browser";

/**
 * Resolve the active TTS provider. `NEXT_PUBLIC_` prefix because TTS
 * selection is needed client-side.
 */
export function getTTSProvider(id?: TTSProviderId): ITTSProvider {
  const providerId =
    id ??
    (getEnv("NEXT_PUBLIC_TTS_PROVIDER") as TTSProviderId | undefined) ??
    DEFAULT_TTS_PROVIDER;
  return ttsRegistry.resolve(providerId);
}
