import { stripMarkdownForSpeech } from "./strip-markdown";

const BOUNDARY = /[.!?\n]/g;

/**
 * Splits a growing, streamed markdown string into speakable chunks as
 * complete sentences arrive, so TTS can start on the first sentence instead
 * of waiting for the whole reply — the "minimal perceived latency"
 * optimization. Stateful: tracks how much of the raw text has already been
 * handed off, so call `next()` with the *full* accumulated text each time
 * (not just the delta).
 */
export class SentenceChunker {
  private rawIndex = 0;

  /** Returns any newly-completed chunk(s) ready to speak (usually 0 or 1). */
  next(fullText: string): string[] {
    const pending = excludeUnclosedFence(fullText.slice(this.rawIndex));
    if (!pending) return [];

    const matches = [...pending.matchAll(BOUNDARY)];
    if (matches.length === 0) return [];

    const lastMatch = matches[matches.length - 1];
    const boundary = (lastMatch.index ?? -1) + 1;
    if (boundary <= 0) return [];

    const readyRaw = pending.slice(0, boundary);
    this.rawIndex += readyRaw.length;

    const cleaned = stripMarkdownForSpeech(readyRaw);
    return cleaned ? [cleaned] : [];
  }

  /** Call once streaming has ended, to speak any trailing remainder. */
  flush(fullText: string): string[] {
    const pending = fullText.slice(this.rawIndex);
    this.rawIndex = fullText.length;
    const cleaned = stripMarkdownForSpeech(pending);
    return cleaned ? [cleaned] : [];
  }
}

/** If `text` has an unclosed ``` fence, hold back everything from its start. */
function excludeUnclosedFence(text: string): string {
  const fenceCount = (text.match(/```/g) ?? []).length;
  if (fenceCount % 2 === 0) return text;
  return text.slice(0, text.lastIndexOf("```"));
}
