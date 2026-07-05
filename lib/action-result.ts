import { z } from "zod";

/**
 * Consistent response shape for every Server Action in the app (see
 * CLAUDE.md: "Consistent API responses"). `data` carries whatever the
 * action needs the caller to have on success (e.g. a new row's id).
 */
export interface ActionResult<T = undefined> {
  success: boolean;
  message?: string;
  fieldErrors?: Record<string, string>;
  data?: T;
}

/** Flatten a ZodError into the first message per field, keyed by field name. */
export function fieldErrorsFromZodError(error: z.ZodError): Record<string, string> {
  const flattened = error.flatten().fieldErrors as Record<string, string[] | undefined>;
  const result: Record<string, string> = {};
  for (const [field, messages] of Object.entries(flattened)) {
    if (messages && messages[0]) result[field] = messages[0];
  }
  return result;
}

/**
 * Every table's primary key is a Postgres `uuid`. Server Actions that take a
 * bare id string (delete/update-by-id, no other fields) validate it with
 * this rather than skipping Zod entirely — CLAUDE.md's "Zod validation on
 * all inputs" applies to a Server Action's id argument the same as it does
 * to a form's fields.
 */
export const idSchema = z.uuid({ message: "Invalid id." });
