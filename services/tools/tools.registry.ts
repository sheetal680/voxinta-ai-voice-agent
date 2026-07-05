import { z } from "zod";
import type { LLMToolDefinition } from "@/types";
import { ProviderError } from "@/services/shared/errors";
import type { ITool } from "./tools.interface";
import { calculatorTool } from "./implementations/calculator.tool";
import { weatherTool } from "./implementations/weather.tool";
import { webSearchTool } from "./implementations/web-search.tool";

/**
 * Registry of every tool the LLM may call.
 *
 * To add a tool:
 *   1. implement `ITool` (see `services/tools/implementations/*`),
 *   2. register it below.
 * Nothing else — the LLM orchestration layer (`services/llm/run-with-tools.ts`)
 * and the chat route both discover tools purely through this registry.
 *
 * `AnyTool` (`ITool<any>`) is deliberate here: each tool has its own concrete
 * parameter type, and this registry deals in an existential "some `ITool`" —
 * `run()` re-validates arguments through the tool's own Zod schema at
 * runtime, so static type safety isn't lost, just erased at the registry
 * boundary. The `any` is isolated to this one alias.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- existential tool type, see above
type AnyTool = ITool<any>;

class ToolRegistry {
  private readonly tools = new Map<string, AnyTool>();

  register(tool: AnyTool): this {
    this.tools.set(tool.name, tool);
    return this;
  }

  has(name: string): boolean {
    return this.tools.has(name);
  }

  get(name: string): AnyTool | undefined {
    return this.tools.get(name);
  }

  /** All registered tools, for building the LLM-facing `tools` list. */
  list(): AnyTool[] {
    return [...this.tools.values()];
  }

  /** LLM-facing tool definitions (Zod parameter schemas converted to JSON Schema). */
  toDefinitions(): LLMToolDefinition[] {
    return this.list().map((tool) => ({
      name: tool.name,
      description: tool.description,
      parameters: z.toJSONSchema(tool.parameters) as Record<string, unknown>,
    }));
  }

  /**
   * Validate `rawArguments` against the named tool's schema and run it.
   * Throws `ProviderError` (domain "tools") for an unknown tool, invalid
   * arguments, or a failure raised by the tool itself — callers can catch
   * this uniformly and feed the message back to the model as the tool result.
   */
  async run(name: string, rawArguments: Record<string, unknown>): Promise<string> {
    const tool = this.tools.get(name);
    if (!tool) {
      throw new ProviderError("tools", `Unknown tool "${name}".`, { providerId: name });
    }

    const parsed = tool.parameters.safeParse(rawArguments);
    if (!parsed.success) {
      throw new ProviderError(
        "tools",
        `Invalid arguments for tool "${name}": ${z.prettifyError(parsed.error)}`,
        { providerId: name },
      );
    }

    try {
      return await tool.execute(parsed.data);
    } catch (cause) {
      if (cause instanceof ProviderError) throw cause;
      throw new ProviderError("tools", `Tool "${name}" failed to run.`, {
        cause,
        providerId: name,
      });
    }
  }
}

export const toolRegistry = new ToolRegistry()
  .register(calculatorTool)
  .register(weatherTool)
  .register(webSearchTool);
