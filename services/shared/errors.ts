/** Which service domain an error originated from. */
export type ServiceDomain = "llm" | "stt" | "tts" | "embeddings";

export interface ProviderErrorOptions {
  cause?: unknown;
  /** Upstream HTTP status, when the failure came from a remote provider. */
  status?: number;
  /** The provider that raised the error, e.g. "groq". */
  providerId?: string;
  /** Whether the caller may safely retry. */
  retryable?: boolean;
}

/**
 * Normalized error thrown by any provider in the service layer. Business
 * logic can catch `ProviderError` without knowing which vendor failed.
 */
export class ProviderError extends Error {
  readonly domain: ServiceDomain;
  readonly status?: number;
  readonly providerId?: string;
  readonly retryable: boolean;

  constructor(domain: ServiceDomain, message: string, options: ProviderErrorOptions = {}) {
    super(message, options.cause !== undefined ? { cause: options.cause } : undefined);
    this.name = "ProviderError";
    this.domain = domain;
    this.status = options.status;
    this.providerId = options.providerId;
    this.retryable = options.retryable ?? false;
  }
}
