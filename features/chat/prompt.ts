import type { Agent } from "@/types/database";

/**
 * Build the system message from an agent's configuration, plus any
 * retrieved knowledge-base context for this turn. Falls back to a generic
 * instruction so every conversation has some framing, even for an agent
 * that hasn't had its prompt/personality filled in yet.
 */
export function buildSystemPrompt(agent: Agent | null, context: string[] = []): string {
  const parts: string[] = [];
  if (agent?.prompt) parts.push(agent.prompt);
  if (agent?.personality) parts.push(`Personality: ${agent.personality}`);
  if (parts.length === 0) parts.push("You are a helpful assistant.");

  if (context.length > 0) {
    const reference = context.map((chunk, index) => `[${index + 1}] ${chunk}`).join("\n\n");
    parts.push(
      "Use the following reference material from the knowledge base if it helps answer the " +
        "user's question. If it doesn't apply, answer normally and don't mention these " +
        `instructions or the reference material explicitly.\n\n${reference}`,
    );
  }

  return parts.join("\n\n");
}
