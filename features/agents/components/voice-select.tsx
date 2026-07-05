"use client";

import { useEffect, useState, type AriaAttributes } from "react";
import { getTTSProvider } from "@/services/tts";
import type { TTSVoice } from "@/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/**
 * Lists voices from the active TTS provider (browser SpeechSynthesis for the
 * MVP). Voice availability is inherently browser/OS-specific — the voice id
 * saved here is best-effort and may not exist in a different visitor's
 * browser at conversation time. A future cloud TTS provider (ElevenLabs,
 * OpenAI) would have stable, portable voice ids instead.
 */
export function VoiceSelect({
  value,
  onValueChange,
  id,
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid,
}: {
  value?: string;
  onValueChange: (value: string) => void;
  /**
   * Forwarded to the underlying trigger — when this is used inside a
   * shadcn `<FormControl>`, `FormControl` injects these via cloneElement
   * so `<FormLabel htmlFor={id}>` actually points at a real element;
   * without forwarding them here, the label would have nothing to
   * associate with.
   */
  id?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: AriaAttributes["aria-invalid"];
}) {
  const [voices, setVoices] = useState<TTSVoice[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const provider = getTTSProvider();

    async function load() {
      const result = provider.isSupported() ? await provider.getVoices() : [];
      if (!cancelled) {
        setVoices(result);
        setLoaded(true);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    // `null` (not `undefined`) for "nothing selected" — passing `undefined`
    // would make Base UI treat the Select as uncontrolled on first render,
    // then flip to controlled the moment a voice is picked.
    <Select value={value || null} onValueChange={(next) => onValueChange(next ?? "")}>
      <SelectTrigger
        id={id}
        aria-describedby={ariaDescribedBy}
        aria-invalid={ariaInvalid}
        className="w-full"
      >
        <SelectValue
          placeholder={loaded ? "Default voice" : "Loading voices…"}
        />
      </SelectTrigger>
      <SelectContent>
        {voices.length === 0 ? (
          <div className="px-2 py-1.5 text-sm text-muted-foreground">
            {loaded ? "No voices available in this browser." : "Loading voices…"}
          </div>
        ) : (
          voices.map((voice) => (
            <SelectItem key={voice.id} value={voice.id}>
              {voice.name} ({voice.lang})
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  );
}
