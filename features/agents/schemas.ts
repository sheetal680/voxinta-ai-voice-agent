import { z } from "zod";
import { DEFAULT_LANGUAGE, DEFAULT_MAX_TOKENS, DEFAULT_TEMPERATURE, MAX_TOKENS_CEILING } from "./constants";

/**
 * Shared schema for creating and editing an agent. Used both client-side
 * (React Hook Form via `zodResolver`) and server-side inside the Server
 * Actions in `./actions.ts` — never trust client input alone.
 *
 * Only `name` is required; everything else has a sensible default so a user
 * can create a bare-minimum agent and flesh it out later.
 */
export const agentFormSchema = z.object({
  name: z
    .string()
    .min(1, { message: "Name is required." })
    .max(100, { message: "Name must be 100 characters or fewer." }),
  description: z
    .string()
    .max(500, { message: "Description must be 500 characters or fewer." })
    .optional(),
  avatarUrl: z.string().optional(),
  prompt: z
    .string()
    .max(8000, { message: "Prompt must be 8000 characters or fewer." })
    .optional(),
  personality: z
    .string()
    .max(2000, { message: "Personality must be 2000 characters or fewer." })
    .optional(),
  welcomeMessage: z
    .string()
    .max(1000, { message: "Welcome message must be 1000 characters or fewer." })
    .optional(),
  voice: z.string().optional(),
  temperature: z
    .number()
    .min(0, { message: "Temperature must be between 0 and 2." })
    .max(2, { message: "Temperature must be between 0 and 2." })
    .default(DEFAULT_TEMPERATURE),
  language: z.string().min(1, { message: "Language is required." }).default(DEFAULT_LANGUAGE),
  maxTokens: z
    .number()
    .int({ message: "Max tokens must be a whole number." })
    .min(1, { message: "Max tokens must be at least 1." })
    .max(MAX_TOKENS_CEILING, { message: `Max tokens must be ${MAX_TOKENS_CEILING} or fewer.` })
    .default(DEFAULT_MAX_TOKENS),
});
/**
 * `temperature`/`language`/`maxTokens` use `.default()`, which makes Zod's
 * input and output types diverge (input: optional; output: always present).
 * `AgentFormValues` (input) is the shape React Hook Form's state holds while
 * editing; `AgentFormInput` (output) is the validated shape actually
 * submitted to the Server Actions in `./actions.ts` once defaults are
 * applied — see the 3-generic `useForm<Values, Context, Input>` call in
 * `./components/agent-form.tsx`.
 */
export type AgentFormValues = z.input<typeof agentFormSchema>;
export type AgentFormInput = z.output<typeof agentFormSchema>;
