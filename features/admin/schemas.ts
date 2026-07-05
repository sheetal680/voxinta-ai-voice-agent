import { z } from "zod";

export const updateUserRoleSchema = z.object({
  userId: z.string().min(1, { message: "userId is required." }),
  role: z.enum(["user", "admin"]),
});
export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>;

/** Lowercase, dash-separated identifier — matches how flags are checked at runtime (a literal string key). */
export const featureFlagKeyPattern = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export const createFeatureFlagSchema = z.object({
  key: z
    .string()
    .min(1, { message: "Key is required." })
    .max(100, { message: "Key must be 100 characters or fewer." })
    .regex(featureFlagKeyPattern, {
      message: "Key must be lowercase letters, numbers, and dashes only (e.g. \"new-voice-ui\").",
    }),
  description: z.string().max(500, { message: "Description must be 500 characters or fewer." }).optional(),
  enabled: z.boolean().default(false),
});
/**
 * `enabled` uses `.default()`, which makes Zod's input/output types diverge
 * (input: optional; output: always present) — same reasoning as
 * features/agents/schemas.ts's AgentFormValues/AgentFormInput split.
 */
export type CreateFeatureFlagFormValues = z.input<typeof createFeatureFlagSchema>;
export type CreateFeatureFlagInput = z.output<typeof createFeatureFlagSchema>;

export const toggleFeatureFlagSchema = z.object({
  id: z.string().min(1, { message: "id is required." }),
  enabled: z.boolean(),
});
export type ToggleFeatureFlagInput = z.infer<typeof toggleFeatureFlagSchema>;

/** Query params for GET /api/admin/report/export. */
export const reportExportQuerySchema = z.object({
  format: z.enum(["json", "csv"]).default("json"),
});
