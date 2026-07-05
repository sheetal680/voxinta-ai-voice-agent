/**
 * Structured server-side logging.
 *
 * Emits one JSON object per line to stdout/stderr — Vercel's log pipeline
 * ingests exactly this format, so no external logging service/dependency is
 * needed to get filterable, queryable logs (see CLAUDE.md: Vercel-only).
 * Never import from a client component; this is for route handlers,
 * Server Actions, and other server-only code.
 */
type LogLevel = "info" | "warn" | "error";

export interface LogFields {
  [key: string]: unknown;
}

function serializeError(error: unknown): { message: string; name?: string; stack?: string } {
  if (error instanceof Error) {
    return { message: error.message, name: error.name, stack: error.stack };
  }
  return { message: typeof error === "string" ? error : JSON.stringify(error) };
}

function write(level: LogLevel, scope: string, message: string, fields?: LogFields): void {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    scope,
    message,
    ...fields,
  };
  const line = JSON.stringify(entry);
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export const logger = {
  info(scope: string, message: string, fields?: LogFields): void {
    write("info", scope, message, fields);
  },
  warn(scope: string, message: string, fields?: LogFields): void {
    write("warn", scope, message, fields);
  },
  /** `error` is the raw caught value (unknown) — serialized consistently, not pre-formatted per call site. */
  error(scope: string, message: string, error?: unknown, fields?: LogFields): void {
    write("error", scope, message, {
      ...(error !== undefined ? { error: serializeError(error) } : {}),
      ...fields,
    });
  },
};
