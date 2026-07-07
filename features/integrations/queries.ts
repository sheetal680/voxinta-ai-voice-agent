import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import { toolRegistry } from "@/services/tools";
import type { LLMToolDefinition } from "@/types";

export interface ToolConfigSummary {
  /** Matches the tool's registry name (e.g. "calculator", "get_weather") — see services/tools. */
  name: string;
  description: string;
  enabled: boolean;
}

/**
 * Every registered tool (services/tools/tools.registry.ts), merged with this
 * agent's tool_configs overrides. A tool with no row for this agent defaults
 * to enabled — tool_configs is opt-out (explicitly disable a tool), matching
 * the column's own `enabled default true` and preserving the existing
 * behavior (every tool available to every agent) until someone explicitly
 * turns one off here.
 *
 * Reading the tool list straight from the registry (not a hardcoded list in
 * this feature) is what makes this page genuinely plugin-based: adding a
 * fourth tool to services/tools makes it show up here with zero changes.
 */
export const getToolConfigsForAgent = cache(async (agentId: string): Promise<ToolConfigSummary[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tool_configs")
    .select("tool_type, enabled")
    .eq("agent_id", agentId);

  if (error) {
    logger.error("integrations", "getToolConfigsForAgent failed", error);
  }

  const overrides = new Map((data ?? []).map((row) => [row.tool_type, row.enabled]));

  return toolRegistry.list().map((tool) => ({
    name: tool.name,
    description: tool.description,
    enabled: overrides.get(tool.name) ?? true,
  }));
});

/** LLM-facing tool definitions for this agent's chat turns — every tool not explicitly disabled. */
export async function getEnabledToolDefinitionsForAgent(agentId: string): Promise<LLMToolDefinition[]> {
  const configs = await getToolConfigsForAgent(agentId);
  const enabledNames = new Set(configs.filter((config) => config.enabled).map((config) => config.name));
  return toolRegistry.toDefinitions().filter((definition) => enabledNames.has(definition.name));
}
