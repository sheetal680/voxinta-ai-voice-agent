import { z } from "zod";

export const setToolEnabledSchema = z.object({
  agentId: z.uuid({ message: "Invalid agent id." }),
  toolName: z.string().min(1, { message: "toolName is required." }),
  enabled: z.boolean(),
});
export type SetToolEnabledInput = z.infer<typeof setToolEnabledSchema>;
