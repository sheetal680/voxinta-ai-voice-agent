import type {
  TTSEventHandlers,
  TTSOptions,
  TTSStatus,
  TTSVoice,
} from "@/types";
import type { ITTSProvider } from "../tts.interface";

/**
 * Browser Text-to-Speech provider (Web Speech API `SpeechSynthesis`).
 *
 * CLIENT-ONLY: touches `window.speechSynthesis`. Instantiate inside client
 * components/hooks. A future ElevenLabs/OpenAI/Piper provider implements the
 * same `ITTSProvider` interface, so voice UI code stays unchanged.
 */
export class BrowserTTSProvider implements ITTSProvider {
  readonly id = "browser" as const;

  private status: TTSStatus = "idle";

  isSupported(): boolean {
    return typeof window !== "undefined" && "speechSynthesis" in window;
  }

  getStatus(): TTSStatus {
    return this.status;
  }

  async getVoices(): Promise<TTSVoice[]> {
    if (!this.isSupported()) return [];
    const synth = window.speechSynthesis;

    const toVoice = (voice: SpeechSynthesisVoice): TTSVoice => ({
      id: voice.voiceURI,
      name: voice.name,
      lang: voice.lang,
      isDefault: voice.default,
    });

    const available = synth.getVoices();
    if (available.length > 0) return available.map(toVoice);

    // Voices can load asynchronously; wait for `voiceschanged` (with a cap).
    return new Promise<TTSVoice[]>((resolve) => {
      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        synth.removeEventListener("voiceschanged", finish);
        resolve(synth.getVoices().map(toVoice));
      };
      synth.addEventListener("voiceschanged", finish);
      window.setTimeout(finish, 1000);
    });
  }

  async speak(
    text: string,
    options: TTSOptions = {},
    handlers: TTSEventHandlers = {},
  ): Promise<void> {
    if (!this.isSupported()) {
      const error = new Error("SpeechSynthesis is not supported in this browser.");
      this.status = "error";
      handlers.onError?.(error);
      throw error;
    }

    const synth = window.speechSynthesis;
    // Stop anything currently queued/playing before starting new speech.
    synth.cancel();

    return new Promise<void>((resolve, reject) => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = options.lang ?? "en-US";
      utterance.rate = options.rate ?? 1;
      utterance.pitch = options.pitch ?? 1;
      utterance.volume = options.volume ?? 1;

      if (options.voiceId) {
        const match = synth.getVoices().find((v) => v.voiceURI === options.voiceId);
        if (match) utterance.voice = match;
      }

      utterance.onstart = () => {
        this.status = "speaking";
        handlers.onStart?.();
      };
      utterance.onboundary = (event: SpeechSynthesisEvent) => {
        handlers.onBoundary?.(event.charIndex);
      };
      utterance.onend = () => {
        this.status = "idle";
        handlers.onEnd?.();
        resolve();
      };
      utterance.onerror = (event: SpeechSynthesisErrorEvent) => {
        this.status = "error";
        const error = new Error(`Speech synthesis error: ${event.error}`);
        handlers.onError?.(error);
        reject(error);
      };

      synth.speak(utterance);
    });
  }

  stop(): void {
    if (!this.isSupported()) return;
    window.speechSynthesis.cancel();
    this.status = "idle";
  }

  pause(): void {
    if (!this.isSupported()) return;
    window.speechSynthesis.pause();
    this.status = "paused";
  }

  resume(): void {
    if (!this.isSupported()) return;
    window.speechSynthesis.resume();
    this.status = "speaking";
  }
}
