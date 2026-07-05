"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { fieldErrorsFromZodError, idSchema, type ActionResult } from "@/lib/action-result";
import { logger } from "@/lib/logger";
import { AVATAR_ALLOWED_MIME_TYPES, AVATAR_MAX_SIZE_BYTES } from "./constants";
import { agentFormSchema, type AgentFormInput } from "./schemas";

/**
 * Server Actions backing /features/agents. Every mutation re-validates its
 * input with the same Zod schema the client used and re-checks the caller's
 * session directly — the dashboard layout's auth guard only protects page
 * renders, not the action endpoint itself (a Server Action is reachable via
 * a direct POST to anyone who has its action id). See CLAUDE.md: "Zod
 * validation on all inputs."
 *
 * Like the auth actions, these return a plain ActionResult and let the
 * calling Client Component navigate on success, rather than calling
 * `redirect()` here (safe only when invoked through a plain `<form
 * action={...}>`, not from React Hook Form's `onSubmit`).
 */

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

/** Extract the storage object path from a public avatar URL, e.g. "<uid>/<file>.png". */
function avatarStoragePathFromUrl(url: string): string | null {
  const marker = "/avatars/";
  const index = url.indexOf(marker);
  return index === -1 ? null : url.slice(index + marker.length);
}

async function removeAvatarFile(
  supabase: Awaited<ReturnType<typeof createClient>>,
  avatarUrl: string,
): Promise<void> {
  const path = avatarStoragePathFromUrl(avatarUrl);
  if (!path) return;

  const { error } = await supabase.storage.from("avatars").remove([path]);
  if (error) {
    // Best-effort cleanup — a failure here shouldn't fail the caller's mutation.
    logger.error("agents", "Failed to remove avatar file", error);
  }
}

function toAgentRow(input: AgentFormInput) {
  return {
    name: input.name,
    description: input.description || null,
    avatar_url: input.avatarUrl || null,
    prompt: input.prompt || null,
    personality: input.personality || null,
    welcome_message: input.welcomeMessage || null,
    voice: input.voice || null,
    temperature: input.temperature,
    language: input.language,
    max_tokens: input.maxTokens,
  };
}

export async function createAgent(input: AgentFormInput): Promise<ActionResult<{ id: string }>> {
  const parsed = agentFormSchema.safeParse(input);
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

  const { data, error } = await supabase
    .from("agents")
    .insert({ owner_id: user.id, ...toAgentRow(parsed.data) })
    .select("id")
    .single();

  if (error) {
    return { success: false, message: error.message };
  }

  revalidatePath("/dashboard/agents");
  return { success: true, data: { id: data.id } };
}

export async function updateAgent(id: string, input: AgentFormInput): Promise<ActionResult> {
  if (!idSchema.safeParse(id).success) {
    return { success: false, message: "Invalid agent id." };
  }

  const parsed = agentFormSchema.safeParse(input);
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
    .from("agents")
    .select("avatar_url")
    .eq("id", id)
    .eq("owner_id", user.id)
    .maybeSingle();

  if (!existing) {
    return { success: false, message: "Agent not found." };
  }

  const { error } = await supabase
    .from("agents")
    .update(toAgentRow(parsed.data))
    .eq("id", id)
    .eq("owner_id", user.id);

  if (error) {
    return { success: false, message: error.message };
  }

  if (existing.avatar_url && existing.avatar_url !== parsed.data.avatarUrl) {
    await removeAvatarFile(supabase, existing.avatar_url);
  }

  revalidatePath("/dashboard/agents");
  revalidatePath(`/dashboard/agents/${id}`);
  return { success: true, message: "Agent updated." };
}

export async function deleteAgent(id: string): Promise<ActionResult> {
  if (!idSchema.safeParse(id).success) {
    return { success: false, message: "Invalid agent id." };
  }

  const { supabase, user } = await requireUser();
  if (!user) {
    return { success: false, message: "You must be signed in." };
  }

  const { data: existing } = await supabase
    .from("agents")
    .select("avatar_url")
    .eq("id", id)
    .eq("owner_id", user.id)
    .maybeSingle();

  if (!existing) {
    return { success: false, message: "Agent not found." };
  }

  const { error } = await supabase.from("agents").delete().eq("id", id).eq("owner_id", user.id);
  if (error) {
    return { success: false, message: error.message };
  }

  if (existing.avatar_url) {
    await removeAvatarFile(supabase, existing.avatar_url);
  }

  revalidatePath("/dashboard/agents");
  return { success: true };
}

export async function uploadAgentAvatar(formData: FormData): Promise<ActionResult<{ url: string }>> {
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
