import type {
  STTEventHandlers,
  STTOptions,
  STTProviderId,
  STTStatus,
} from "@/types";

/**
 * Contract every Speech-to-Text provider must satisfy.
 *
 * Session based so both streaming (browser Web Speech) and batch
 * (server-side Whisper) providers fit the same shape:
 *  - `start()` begins a session and wires up event handlers;
 *  - results arrive via `handlers.onResult` (interim + final for streaming,
 *    a single final for batch);
 *  - `stop()` ends gracefully; `abort()` cancels immediately.
 */
export interface ISTTProvider {
  readonly id: STTProviderId;

  /** Whether this provider can run in the current environment. */
  isSupported(): boolean;

  start(options?: STTOptions, handlers?: STTEventHandlers): void;
  stop(): void;
  abort(): void;

  getStatus(): STTStatus;
}
