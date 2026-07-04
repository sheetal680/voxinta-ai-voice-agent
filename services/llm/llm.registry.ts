import type { LLMProviderId } from "@/types";
import { getEnv } from "@/services/shared/env";
import { ProviderRegistry } from "@/services/shared/registry";
import type { ILLMProvider } from "./llm.interface";
import { GroqProvider } from "./providers/groq.provider";

/**
 * Registry of available LLM providers.
 *
 * To add a provider (OpenAI, Claude, Gemini, Ollama):
 *   1. add its id to `LLMProviderId` in `types/llm.ts`,
 *   2. implement `ILLMProvider`,
 *   3. register it below.
 * Nothing else in the app changes.
 */
export const llmRegistry = new ProviderRegistry<LLMProviderId, ILLMProvider>().register(
  "groq",
  () => new GroqProvider(),
);

/** Provider id used when `LLM_PROVIDER` is unset. */
export const DEFAULT_LLM_PROVIDER: LLMProviderId = "groq";

/**
 * Resolve the active LLM provider. Pass an explicit id to override; otherwise
 * it reads `LLM_PROVIDER` from the environment, falling back to the default.
 */
export function getLLMProvider(id?: LLMProviderId): ILLMProvider {
  const providerId = id ?? (getEnv("LLM_PROVIDER") as LLMProviderId | undefined) ?? DEFAULT_LLM_PROVIDER;
  return llmRegistry.resolve(providerId);
}
