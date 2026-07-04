import type {
  STTEventHandlers,
  STTOptions,
  STTResult,
  STTStatus,
} from "@/types";
import type { ISTTProvider } from "../stt.interface";

/**
 * Browser Speech-to-Text provider (Web Speech API `SpeechRecognition`).
 *
 * CLIENT-ONLY: touches `window`. Instantiate inside client components/hooks.
 * A future server-side Whisper provider implements the same `ISTTProvider`
 * interface (buffering mic audio between start/stop, then emitting one final
 * result), so voice UI code stays unchanged.
 */
export class BrowserSTTProvider implements ISTTProvider {
  readonly id = "browser" as const;

  private recognition: SpeechRecognition | null = null;
  private handlers: STTEventHandlers = {};
  private status: STTStatus = "idle";

  isSupported(): boolean {
    if (typeof window === "undefined") return false;
    return Boolean(window.SpeechRecognition ?? window.webkitSpeechRecognition);
  }

  getStatus(): STTStatus {
    return this.status;
  }

  private setStatus(status: STTStatus): void {
    this.status = status;
    this.handlers.onStatusChange?.(status);
  }

  start(options: STTOptions = {}, handlers: STTEventHandlers = {}): void {
    this.handlers = handlers;

    const Ctor =
      typeof window !== "undefined"
        ? window.SpeechRecognition ?? window.webkitSpeechRecognition
        : undefined;

    if (!Ctor) {
      const error = new Error("Web Speech API is not supported in this browser.");
      this.setStatus("error");
      this.handlers.onError?.(error);
      return;
    }

    // Restarting: tear down any prior session first.
    this.abort();

    const recognition = new Ctor();
    recognition.lang = options.lang ?? "en-US";
    recognition.continuous = options.continuous ?? true;
    recognition.interimResults = options.interimResults ?? true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => this.setStatus("listening");

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        const alternative = result[0];
        if (!alternative) continue;
        const payload: STTResult = {
          transcript: alternative.transcript,
          isFinal: result.isFinal,
          confidence: alternative.confidence,
        };
        this.handlers.onResult?.(payload);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      this.setStatus("error");
      this.handlers.onError?.(new Error(`Speech recognition error: ${event.error}`));
    };

    recognition.onend = () => {
      // "aborted" already moved us to stopped/error; otherwise mark stopped.
      if (this.status === "listening") this.setStatus("stopped");
      this.handlers.onEnd?.();
    };

    this.recognition = recognition;
    try {
      recognition.start();
    } catch (cause) {
      this.setStatus("error");
      this.handlers.onError?.(
        cause instanceof Error ? cause : new Error("Failed to start speech recognition."),
      );
    }
  }

  stop(): void {
    if (!this.recognition) return;
    this.setStatus("processing");
    this.recognition.stop();
  }

  abort(): void {
    if (!this.recognition) return;
    const recognition = this.recognition;
    recognition.onresult = null;
    recognition.onerror = null;
    recognition.onend = null;
    recognition.onstart = null;
    recognition.abort();
    this.recognition = null;
    if (this.status === "listening" || this.status === "processing") {
      this.setStatus("stopped");
    }
  }
}
