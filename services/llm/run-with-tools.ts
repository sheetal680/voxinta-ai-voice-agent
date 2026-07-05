import type { LLMGenerateParams, LLMMessage, LLMStreamChunk } from "@/types";
import { toolRegistry } from "@/services/tools";
import type { ILLMProvider } from "./llm.interface";

/** Tool-resolution round-trips allowed before forcing a final, tool-less answer. */
const DEFAULT_MAX_TOOL_ROUNDS = 4;

export interface RunWithToolsParams extends LLMGenerateParams {
  /** Tool-resolution round-trips allowed before forcing a final answer. */
  maxToolRounds?: number;
  /**
   * Called once per tool-call round with the assistant's tool-call message
   * and each tool's result message, in the order they should be persisted
   * (e.g. inserted into the `messages` table) — before the next round starts.
   */
  onIntermediateMessage?: (message: LLMMessage) => void | Promise<void>;
}

/**
 * Drives an `ILLMProvider` through as many tool-call round-trips as the
 * model requests, feeding each tool's result back into the conversation,
 * and streams the final text answer to the caller.
 *
 * Every round — including tool-resolution rounds — uses `streamGenerate`
 * (never the non-streaming `generate`), buffering that round's chunks
 * internally until its `finishReason` is known. When a round finishes
 * without requesting a tool call (the common case), its buffered chunks are
 * forwarded immediately: exactly one streamed LLM call, no added latency.
 * Only when the model actually asks for tools does this cost extra
 * round-trips — and those are round-trips the task genuinely requires.
 */
export async function* runWithTools(
  provider: ILLMProvider,
  params: RunWithToolsParams,
): AsyncGenerator<LLMStreamChunk> {
  const { maxToolRounds = DEFAULT_MAX_TOOL_ROUNDS, onIntermediateMessage, tools, ...rest } = params;
  const availableTools = tools ?? toolRegistry.toDefinitions();

  let messages = params.messages;

  for (let round = 0; ; round++) {
    // Once the round cap is hit, omit `tools` so the model has no choice but
    // to produce a final text answer — guarantees termination.
    const roundTools = round < maxToolRounds ? availableTools : undefined;

    const bufferedChunks: LLMStreamChunk[] = [];
    let content = "";

    for await (const chunk of provider.streamGenerate({ ...rest, messages, tools: roundTools })) {
      bufferedChunks.push(chunk);
      content += chunk.delta;
    }

    const finalChunk = bufferedChunks[bufferedChunks.length - 1];
    const toolCalls = finalChunk?.toolCalls;

    if (finalChunk?.finishReason !== "tool_calls" || !toolCalls || toolCalls.length === 0) {
      for (const chunk of bufferedChunks) yield chunk;
      return;
    }

    const assistantMessage: LLMMessage = { role: "assistant", content, toolCalls };
    await onIntermediateMessage?.(assistantMessage);

    const toolResultMessages: LLMMessage[] = [];
    for (const call of toolCalls) {
      const result = await toolRegistry.run(call.name, call.arguments).catch((error: unknown) =>
        error instanceof Error ? `Error: ${error.message}` : "Tool execution failed.",
      );
      const toolMessage: LLMMessage = {
        role: "tool",
        content: result,
        toolCallId: call.id,
        name: call.name,
      };
      toolResultMessages.push(toolMessage);
      await onIntermediateMessage?.(toolMessage);
    }

    messages = [...messages, assistantMessage, ...toolResultMessages];
  }
}
