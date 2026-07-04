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
