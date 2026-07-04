import type {
  LLMFinishReason,
  LLMGenerateParams,
  LLMMessage,
  LLMResponse,
  LLMStreamChunk,
  LLMUsage,
} from "@/types";
import { ProviderError } from "@/services/shared/errors";
import { getEnv, requireEnv } from "@/services/shared/env";
import type { ILLMProvider } from "../llm.interface";

/**
 * Groq LLM provider (OpenAI-compatible Chat Completions API).
 *
 * SERVER-ONLY: reads `GROQ_API_KEY`. Import from route handlers / server
 * actions only — never from a client component. Uses global `fetch`, so it
 * runs on both the Node and Edge runtimes with no SDK dependency.
 */
const DEFAULT_BASE_URL = "https://api.groq.com/openai/v1";
const DEFAULT_MODEL = "llama-3.3-70b-versatile";

// --- Minimal shapes of the Groq/OpenAI wire format we consume. ---------------

interface GroqChatMessagePayload {
  role: string;
  content: string;
  name?: string;
  tool_call_id?: string;
}

interface GroqUsagePayload {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

interface GroqCompletionResponse {
  model: string;
  choices: Array<{
    message: { content: string | null };
    finish_reason: string | null;
  }>;
  usage?: GroqUsagePayload;
}

interface GroqStreamChunkPayload {
  model: string;
  choices: Array<{
    delta: { content?: string | null };
    finish_reason: string | null;
  }>;
  usage?: GroqUsagePayload | null;
}

// --- Helpers -----------------------------------------------------------------

function mapFinishReason(reason: string | null | undefined): LLMFinishReason {
  switch (reason) {
    case "stop":
      return "stop";
    case "length":
      return "length";
    case "tool_calls":
    case "function_call":
      return "tool_calls";
    case "content_filter":
      return "content_filter";
    case null:
    case undefined:
      return "unknown";
    default:
      return "unknown";
  }
}

function mapUsage(usage: GroqUsagePayload | null | undefined): LLMUsage | undefined {
  if (!usage) return undefined;
  return {
    promptTokens: usage.prompt_tokens,
    completionTokens: usage.completion_tokens,
    totalTokens: usage.total_tokens,
  };
}

function toWireMessage(message: LLMMessage): GroqChatMessagePayload {
  return {
    role: message.role,
    content: message.content,
    ...(message.name ? { name: message.name } : {}),
    ...(message.toolCallId ? { tool_call_id: message.toolCallId } : {}),
  };
}

export class GroqProvider implements ILLMProvider {
  readonly id = "groq" as const;

  private readonly baseUrl: string;
  private readonly defaultModel: string;

  constructor() {
    this.baseUrl = getEnv("GROQ_BASE_URL", DEFAULT_BASE_URL) as string;
    this.defaultModel = getEnv("GROQ_MODEL", DEFAULT_MODEL) as string;
  }

  private buildBody(params: LLMGenerateParams, stream: boolean): Record<string, unknown> {
    return {
      model: params.model ?? this.defaultModel,
      messages: params.messages.map(toWireMessage),
      ...(params.temperature !== undefined ? { temperature: params.temperature } : {}),
      ...(params.maxTokens !== undefined ? { max_tokens: params.maxTokens } : {}),
      ...(params.topP !== undefined ? { top_p: params.topP } : {}),
      ...(params.stop ? { stop: params.stop } : {}),
      stream,
      ...(stream ? { stream_options: { include_usage: true } } : {}),
    };
  }

  private async request(
    params: LLMGenerateParams,
    stream: boolean,
  ): Promise<Response> {
    const apiKey = requireEnv("GROQ_API_KEY");
    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(this.buildBody(params, stream)),
        signal: params.signal,
      });
    } catch (cause) {
      throw new ProviderError("llm", "Failed to reach Groq API.", {
        cause,
        providerId: this.id,
        retryable: true,
      });
    }

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      throw new ProviderError("llm", `Groq API error ${response.status}: ${detail}`, {
        status: response.status,
        providerId: this.id,
        retryable: response.status === 429 || response.status >= 500,
      });
    }
    return response;
  }

  async generate(params: LLMGenerateParams): Promise<LLMResponse> {
    const response = await this.request(params, false);
    const data = (await response.json()) as GroqCompletionResponse;
    const choice = data.choices[0];
    if (!choice) {
      throw new ProviderError("llm", "Groq returned no choices.", { providerId: this.id });
    }
    return {
      content: choice.message.content ?? "",
      model: data.model,
      finishReason: mapFinishReason(choice.finish_reason),
      usage: mapUsage(data.usage),
      raw: data,
    };
  }

  async *streamGenerate(params: LLMGenerateParams): AsyncIterable<LLMStreamChunk> {
    const response = await this.request(params, true);
    const body = response.body;
    if (!body) {
      throw new ProviderError("llm", "Groq returned an empty stream body.", {
        providerId: this.id,
      });
    }

    const reader = body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let finishReason: LLMFinishReason | undefined;
    let usage: LLMUsage | undefined;

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        // Keep the last (possibly partial) line in the buffer.
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data:")) continue;

          const payload = trimmed.slice(5).trim();
          if (payload === "[DONE]") continue;

          let chunk: GroqStreamChunkPayload;
          try {
            chunk = JSON.parse(payload) as GroqStreamChunkPayload;
          } catch {
            // Ignore keep-alive / non-JSON lines.
            continue;
          }

          if (chunk.usage) usage = mapUsage(chunk.usage);

          const choice = chunk.choices[0];
          if (choice?.finish_reason) finishReason = mapFinishReason(choice.finish_reason);

          const delta = choice?.delta?.content ?? "";
          if (delta) {
            yield { delta, done: false };
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    yield { delta: "", done: true, finishReason: finishReason ?? "stop", usage };
  }
}
