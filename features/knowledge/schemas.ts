import { z } from "zod";

/** Validates the structured (non-file) fields alongside an upload's FormData. */
export const uploadDocumentSchema = z.object({
  agentId: z.string().min(1, { message: "agentId is required." }),
});
export type UploadDocumentInput = z.infer<typeof uploadDocumentSchema>;

export const documentIdSchema = z.object({
  documentId: z.string().min(1, { message: "documentId is required." }),
});
