/**
 * Turns a tool's registry name (e.g. "get_weather") into a display label
 * ("Get Weather") without a hardcoded per-tool label map — a new tool shows
 * up here correctly with zero changes, matching the plugin-based registry
 * it's read from (see features/integrations/queries.ts).
 */
export function humanizeToolName(name: string): string {
  return name
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
