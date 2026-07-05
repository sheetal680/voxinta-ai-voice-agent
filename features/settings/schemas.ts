import { z } from "zod";
import {
  AI_MAX_TOKENS_CEILING,
  API_KEY_PROVIDER_VALUES,
  DEFAULT_AI_MAX_TOKENS,
  DEFAULT_AI_PROVIDER,
  DEFAULT_AI_TEMPERATURE,
  DEFAULT_VOICE_LANGUAGE,
} from "./constants";

export const profileFormSchema = z.object({
  fullName: z.string().max(100, { message: "Name must be 100 characters or fewer." }).optional(),
  avatarUrl: z.string().optional(),
});
export type ProfileFormValues = z.infer<typeof profileFormSchema>;

/**
 * Account-level defaults for new agents/generations — a forward-looking
 * setting (see features/settings/constants.ts) that isn't yet consulted by
 * agent creation or the chat route; this commit is scoped to persisting it.
 */
export const aiSettingsSchema = z.object({
  provider: z.enum(["groq", "openai", "anthropic", "gemini", "ollama"]).default(DEFAULT_AI_PROVIDER),
  model: z.string().max(200, { message: "Model must be 200 characters or fewer." }).optional(),
  temperature: z
    .number()
    .min(0, { message: "Temperature must be between 0 and 2." })
    .max(2, { message: "Temperature must be between 0 and 2." })
    .default(DEFAULT_AI_TEMPERATURE),
  maxTokens: z
    .number()
    .int({ message: "Max tokens must be a whole number." })
    .min(1, { message: "Max tokens must be at least 1." })
    .max(AI_MAX_TOKENS_CEILING, { message: `Max tokens must be ${AI_MAX_TOKENS_CEILING} or fewer.` })
    .default(DEFAULT_AI_MAX_TOKENS),
});
export type AiSettingsFormValues = z.input<typeof aiSettingsSchema>;
export type AiSettingsInput = z.output<typeof aiSettingsSchema>;

export const notificationsSchema = z.object({
  emailNewConversation: z.boolean().default(true),
  emailWeeklySummary: z.boolean().default(true),
  emailAgentErrors: z.boolean().default(true),
});
export type NotificationsValues = z.infer<typeof notificationsSchema>;

export const voicePreferencesSchema = z.object({
  voice: z.string().optional(),
  language: z.string().min(1, { message: "Language is required." }).default(DEFAULT_VOICE_LANGUAGE),
});
export type VoicePreferencesFormValues = z.input<typeof voicePreferencesSchema>;
export type VoicePreferencesInput = z.output<typeof voicePreferencesSchema>;

export const apiKeyFormSchema = z.object({
  provider: z.enum(API_KEY_PROVIDER_VALUES),
  apiKey: z
    .string()
    .min(8, { message: "That doesn't look like a valid API key." })
    .max(500, { message: "API key must be 500 characters or fewer." }),
});
export type ApiKeyFormValues = z.infer<typeof apiKeyFormSchema>;
