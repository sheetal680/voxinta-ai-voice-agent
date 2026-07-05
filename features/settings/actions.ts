"use server";

import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { fieldErrorsFromZodError, type ActionResult } from "@/lib/action-result";
import { logger } from "@/lib/logger";
import { encryptSecret, previewSecret } from "@/services/shared/encryption";
import type { Database, Json } from "@/types/database";
import {
  AI_MAX_TOKENS_CEILING,
  API_KEY_PROVIDER_VALUES,
  AVATAR_ALLOWED_MIME_TYPES,
  AVATAR_MAX_SIZE_BYTES,
} from "./constants";
import {
  aiSettingsSchema,
  apiKeyFormSchema,
  notificationsSchema,
  profileFormSchema,
  voicePreferencesSchema,
  type AiSettingsFormValues,
  type ApiKeyFormValues,
  type NotificationsValues,
  type ProfileFormValues,
  type VoicePreferencesFormValues,
} from "./schemas";

/**
 * Server Actions backing /features/settings. Every mutation re-validates its
 * input with the same Zod schema the client used and re-checks the caller's
 * session directly, per the same convention as every other feature's
 * actions (see features/agents/actions.ts).
 *
 * Theme is deliberately NOT here — next-themes persists it client-side
 * (localStorage), which is the standard approach and avoids a server round
 * trip (and SSR flash-of-wrong-theme) for a purely presentational preference.
 */

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

/**
 * Merges `value` into the caller's `profiles.preferences` under `section`,
 * leaving every other section untouched. A read-modify-write rather than a
 * partial jsonb update since supabase-js has no deep-merge update helper —
 * fine for infrequent settings writes.
 */
async function updatePreferenceSection(
  supabase: SupabaseClient<Database>,
  userId: string,
  section: string,
  value: Record<string, unknown>,
): Promise<string | undefined> {
  const { data: existing, error: fetchError } = await supabase
    .from("profiles")
    .select("preferences")
    .eq("id", userId)
    .maybeSingle();
  if (fetchError) return fetchError.message;

  const preferences = {
    ...((existing?.preferences as Record<string, unknown> | null) ?? {}),
    [section]: value,
  };

  const { error } = await supabase
    .from("profiles")
    .update({ preferences: preferences as Json })
    .eq("id", userId);
  return error?.message;
}

/** Extract the storage object path from a public avatar URL, e.g. "<uid>/<file>.png". */
function avatarStoragePathFromUrl(url: string): string | null {
  const marker = "/avatars/";
  const index = url.indexOf(marker);
  return index === -1 ? null : url.slice(index + marker.length);
}

async function removeAvatarFile(supabase: SupabaseClient<Database>, avatarUrl: string): Promise<void> {
  const path = avatarStoragePathFromUrl(avatarUrl);
  if (!path) return;
  const { error } = await supabase.storage.from("avatars").remove([path]);
  if (error) {
    logger.error("settings", "Failed to remove avatar file", error);
  }
}

export async function updateProfile(input: ProfileFormValues): Promise<ActionResult> {
  const parsed = profileFormSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      message: "Please fix the errors below.",
      fieldErrors: fieldErrorsFromZodError(parsed.error),
    };
  }

  const { supabase, user } = await requireUser();
  if (!user) {
    return { success: false, message: "You must be signed in." };
  }

  const { data: existing } = await supabase
    .from("profiles")
    .select("avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: parsed.data.fullName || null,
      avatar_url: parsed.data.avatarUrl || null,
    })
    .eq("id", user.id);

  if (error) {
    return { success: false, message: error.message };
  }

  if (existing?.avatar_url && existing.avatar_url !== parsed.data.avatarUrl) {
    await removeAvatarFile(supabase, existing.avatar_url);
  }

  revalidatePath("/dashboard/settings");
  return { success: true, message: "Profile updated." };
}

export async function uploadProfileAvatar(formData: FormData): Promise<ActionResult<{ url: string }>> {
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { success: false, message: "No file provided." };
  }
  if (!(AVATAR_ALLOWED_MIME_TYPES as readonly string[]).includes(file.type)) {
    return { success: false, message: "Avatar must be a PNG, JPEG, WebP, or GIF image." };
  }
  if (file.size > AVATAR_MAX_SIZE_BYTES) {
    return { success: false, message: "Avatar must be 2MB or smaller." };
  }

  const { supabase, user } = await requireUser();
  if (!user) {
    return { success: false, message: "You must be signed in." };
  }

  const extension = file.name.split(".").pop() || "png";
  const path = `${user.id}/${crypto.randomUUID()}.${extension}`;

  const { error } = await supabase.storage.from("avatars").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) {
    return { success: false, message: error.message };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("avatars").getPublicUrl(path);

  return { success: true, data: { url: publicUrl } };
}

export async function updateAiSettings(input: AiSettingsFormValues): Promise<ActionResult> {
  const parsed = aiSettingsSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      message: "Please fix the errors below.",
      fieldErrors: fieldErrorsFromZodError(parsed.error),
    };
  }

  const { supabase, user } = await requireUser();
  if (!user) {
    return { success: false, message: "You must be signed in." };
  }

  const errorMessage = await updatePreferenceSection(supabase, user.id, "aiDefaults", {
    provider: parsed.data.provider,
    model: parsed.data.model || null,
    temperature: parsed.data.temperature,
    maxTokens: Math.min(parsed.data.maxTokens, AI_MAX_TOKENS_CEILING),
  });
  if (errorMessage) {
    return { success: false, message: errorMessage };
  }

  revalidatePath("/dashboard/settings");
  return { success: true, message: "AI settings updated." };
}

export async function updateNotifications(input: NotificationsValues): Promise<ActionResult> {
  const parsed = notificationsSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: "Invalid notification preferences." };
  }

  const { supabase, user } = await requireUser();
  if (!user) {
    return { success: false, message: "You must be signed in." };
  }

  const errorMessage = await updatePreferenceSection(supabase, user.id, "notifications", parsed.data);
  if (errorMessage) {
    return { success: false, message: errorMessage };
  }

  revalidatePath("/dashboard/settings");
  return { success: true };
}

export async function updateVoicePreferences(input: VoicePreferencesFormValues): Promise<ActionResult> {
  const parsed = voicePreferencesSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      message: "Please fix the errors below.",
      fieldErrors: fieldErrorsFromZodError(parsed.error),
    };
  }

  const { supabase, user } = await requireUser();
  if (!user) {
    return { success: false, message: "You must be signed in." };
  }

  const errorMessage = await updatePreferenceSection(supabase, user.id, "voiceDefaults", {
    voice: parsed.data.voice || null,
    language: parsed.data.language,
  });
  if (errorMessage) {
    return { success: false, message: errorMessage };
  }

  revalidatePath("/dashboard/settings");
  return { success: true, message: "Voice preferences updated." };
}

export async function saveApiKey(input: ApiKeyFormValues): Promise<ActionResult> {
  const parsed = apiKeyFormSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      message: "Please fix the errors below.",
      fieldErrors: fieldErrorsFromZodError(parsed.error),
    };
  }

  const { supabase, user } = await requireUser();
  if (!user) {
    return { success: false, message: "You must be signed in." };
  }

  const { error } = await supabase.from("user_api_keys").upsert(
    {
      owner_id: user.id,
      provider: parsed.data.provider,
      encrypted_key: encryptSecret(parsed.data.apiKey),
      key_preview: previewSecret(parsed.data.apiKey),
    },
    { onConflict: "owner_id,provider" },
  );

  if (error) {
    return { success: false, message: error.message };
  }

  revalidatePath("/dashboard/settings");
  return { success: true, message: "API key saved." };
}

export async function deleteApiKey(provider: string): Promise<ActionResult> {
  if (!(API_KEY_PROVIDER_VALUES as readonly string[]).includes(provider)) {
    return { success: false, message: "Invalid provider." };
  }

  const { supabase, user } = await requireUser();
  if (!user) {
    return { success: false, message: "You must be signed in." };
  }

  const { error } = await supabase
    .from("user_api_keys")
    .delete()
    .eq("owner_id", user.id)
    .eq("provider", provider);

  if (error) {
    return { success: false, message: error.message };
  }

  revalidatePath("/dashboard/settings");
  return { success: true };
}
