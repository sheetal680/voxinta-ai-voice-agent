/**
 * Reduce markdown to plain speakable text for TTS. Not a full parser —
 * good enough that a spoken reply doesn't include literal asterisks,
 * backticks, or pipe characters. Fenced code blocks are dropped entirely
 * (reading code character-by-character is a bad listening experience);
 * inline code keeps its text since short snippets read fine as words.
 */
export function stripMarkdownForSpeech(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, " code block ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/(\*\*\*|___)(.*?)\1/g, "$2")
    .replace(/(\*\*|__)(.*?)\1/g, "$2")
    .replace(/(?<![\w*])\*(?!\s)(.*?)(?<!\s)\*(?!\w)/g, "$1")
    .replace(/`([^`]*)`/g, "$1")
    .replace(/^>\s?/gm, "")
    .replace(/^[-*+]\s+/gm, "")
    .replace(/^\d+\.\s+/gm, "")
    .replace(/\|/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
