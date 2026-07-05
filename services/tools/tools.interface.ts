import type { z } from "zod";

/**
 * Contract every tool (function the model can call) must satisfy.
 *
 * Adding a tool means implementing this interface and registering it in
 * `services/tools/tools.registry.ts` — no other code changes. `parameters`
 * is a Zod schema so the same source of truth both validates the model's
 * arguments at runtime and produces the JSON Schema advertised to the LLM
 * (see `toToolDefinition` in the registry).
 */
export interface ITool<TParams = unknown> {
  /** Stable, LLM-facing identifier (e.g. "calculator"). Must be unique. */
  readonly name: string;
  /** Tells the model what the tool does and when to use it. */
  readonly description: string;
  /** Validates and parses the model-supplied arguments. */
  readonly parameters: z.ZodType<TParams>;
  /** Runs the tool and returns a plain-text result to feed back to the model. */
  execute(params: TParams): Promise<string>;
}
