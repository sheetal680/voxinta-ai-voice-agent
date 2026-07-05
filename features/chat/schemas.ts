import { z } from "zod";

/**
 * Request body for POST /api/chat. A discriminated union so one endpoint
 * handles both a normal turn and "regenerate the last response" — the
 * server reconstructs context from the conversation's own history either
 * way, so the client never needs to resend it.
 */
export const chatRequestSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("message"),
    conversationId: z.string().min(1, { message: "conversationId is required." }),
    content: z
      .string()
      .min(1, { message: "Message cannot be empty." })
      .max(4000, { message: "Message must be 4000 characters or fewer." }),
  }),
  z.object({
    type: z.literal("regenerate"),
    conversationId: z.string().min(1, { message: "conversationId is required." }),
  }),
]);
export type ChatRequest = z.infer<typeof chatRequestSchema>;

/** Query params for GET /api/conversations/export. Every field is optional — see the route's own doc comment for how `ids` vs. the filter fields interact. */
export const conversationsExportQuerySchema = z.object({
  format: z.enum(["json", "csv"]).default("json"),
  ids: z.string().optional(),
  agentId: z.string().optional(),
  search: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});

