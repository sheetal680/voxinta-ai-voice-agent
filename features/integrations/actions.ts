"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { fieldErrorsFromZodError, type ActionResult } from "@/lib/action-result";
import { toolRegistry } from "@/services/tools";
import { getAgent } from "@/features/agents/queries";
import { setToolEnabledSchema, type SetToolEnabledInput } from "./schemas";

/**
 * Server Actions backing /features/integrations. Re-validates input and
 * re-checks the caller's session directly, per the same convention as every
 * other feature's actions.ts (a Server Action is reachable via direct POST
 * to anyone who has its action id, regardless of what the calling page did).
 */
export async function setToolEnabled(input: SetToolEnabledInput): Promise<ActionResult> {
  const parsed = setToolEnabledSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      message: "Invalid input.",
      fieldErrors: fieldErrorsFromZodError(parsed.error),
    };
  }
  if (!toolRegistry.has(parsed.data.toolName)) {
    return { success: false, message: "Unknown tool." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, message: "You must be signed in." };
  }

  // getAgent is RLS-scoped (null if it doesn't exist or isn't this user's) —
  // checked explicitly rather than relying on tool_configs' own RLS alone,
  // so a bad agentId fails clearly instead of silently upserting an orphaned
  // config row nobody's chat turn will ever read.
  const agent = await getAgent(parsed.data.agentId);
  if (!agent) {
    return { success: false, message: "Agent not found." };
  }

  const { error } = await supabase.from("tool_configs").upsert(
    {
      owner_id: user.id,
      agent_id: agent.id,
      tool_type: parsed.data.toolName,
      name: parsed.data.toolName,
      enabled: parsed.data.enabled,
    },
    { onConflict: "agent_id,tool_type" },
  );

  if (error) {
    return { success: false, message: error.message };
  }

  revalidatePath(`/dashboard/integrations/${agent.id}`);
  return { success: true };
}
