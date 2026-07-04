import type { Agent } from "@/types/database";

/**
 * Build the system message from an agent's configuration. Falls back to a
 * generic instruction so every conversation has some framing, even for an
 * agent that hasn't had its prompt/personality filled in yet.
 */
export function buildSystemPrompt(agent: Agent | null): string {
  const parts: string[] = [];
  if (agent?.prompt) parts.push(agent.prompt);
  if (agent?.personality) parts.push(`Personality: ${agent.personality}`);
  return parts.length > 0 ? parts.join("\n\n") : "You are a helpful assistant.";
}
