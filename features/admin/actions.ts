"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { fieldErrorsFromZodError, type ActionResult } from "@/lib/action-result";
import {
  createFeatureFlagSchema,
  toggleFeatureFlagSchema,
  updateUserRoleSchema,
  type CreateFeatureFlagInput,
  type ToggleFeatureFlagInput,
  type UpdateUserRoleInput,
} from "./schemas";

/**
 * Server Actions backing /features/admin. Every mutation re-checks that the
 * caller is an admin directly — the admin layout's gate only protects page
 * renders, not the action endpoint itself (see the same reasoning in every
 * other feature's actions.ts). RLS and, for role changes, the
 * guard_profile_role trigger are the last line of defense either way.
 */
async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, isAdmin: false };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  return { supabase, user, isAdmin: profile?.role === "admin" };
}

export async function updateUserRole(input: UpdateUserRoleInput): Promise<ActionResult> {
  const parsed = updateUserRoleSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: "Invalid role change." };
  }

  const { supabase, user, isAdmin } = await requireAdmin();
  if (!isAdmin) {
    return { success: false, message: "Admin access required." };
  }
  if (user?.id === parsed.data.userId) {
    // Blocked here, not just disabled in the UI (a Server Action is
    // directly callable) — otherwise the last admin could demote
    // themselves and lock everyone out of the admin panel.
    return { success: false, message: "You can't change your own role." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ role: parsed.data.role })
    .eq("id", parsed.data.userId);

  if (error) {
    return { success: false, message: error.message };
  }

  revalidatePath("/dashboard/admin/users");
  return { success: true, message: "Role updated." };
}

export async function createFeatureFlag(input: CreateFeatureFlagInput): Promise<ActionResult> {
  const parsed = createFeatureFlagSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      message: "Please fix the errors below.",
      fieldErrors: fieldErrorsFromZodError(parsed.error),
    };
  }

  const { supabase, isAdmin } = await requireAdmin();
  if (!isAdmin) {
    return { success: false, message: "Admin access required." };
  }

  const { error } = await supabase.from("feature_flags").insert({
    key: parsed.data.key,
    description: parsed.data.description || null,
    enabled: parsed.data.enabled,
  });

  if (error) {
    return {
      success: false,
      message: error.code === "23505" ? "A flag with that key already exists." : error.message,
    };
  }

  revalidatePath("/dashboard/admin/feature-flags");
  return { success: true, message: "Feature flag created." };
}

export async function toggleFeatureFlag(input: ToggleFeatureFlagInput): Promise<ActionResult> {
  const parsed = toggleFeatureFlagSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: "Invalid flag update." };
  }

  const { supabase, isAdmin } = await requireAdmin();
  if (!isAdmin) {
    return { success: false, message: "Admin access required." };
  }

  const { error } = await supabase
    .from("feature_flags")
    .update({ enabled: parsed.data.enabled })
    .eq("id", parsed.data.id);

  if (error) {
    return { success: false, message: error.message };
  }

  revalidatePath("/dashboard/admin/feature-flags");
  return { success: true };
}

export async function deleteFeatureFlag(id: string): Promise<ActionResult> {
  const { supabase, isAdmin } = await requireAdmin();
  if (!isAdmin) {
    return { success: false, message: "Admin access required." };
  }

  const { error } = await supabase.from("feature_flags").delete().eq("id", id);
  if (error) {
    return { success: false, message: error.message };
  }

  revalidatePath("/dashboard/admin/feature-flags");
  return { success: true };
}
