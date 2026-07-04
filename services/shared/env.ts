/**
 * Small helpers for reading centralized configuration from environment
 * variables. Keeping env access here (rather than scattered `process.env`
 * reads) makes the config surface easy to audit.
 *
 * NOTE: secrets (API keys) must NOT use the `NEXT_PUBLIC_` prefix — that
 * would inline them into the client bundle. Provider secrets are read here
 * only from server-executed code (route handlers, server actions).
 */

/** Read an env var, or return `fallback` (default `undefined`). */
export function getEnv(name: string, fallback?: string): string | undefined {
  const value = process.env[name];
  return value === undefined || value === "" ? fallback : value;
}

/** Read a required env var, throwing a clear error if it is missing. */
export function requireEnv(name: string): string {
  const value = process.env[name];
  if (value === undefined || value === "") {
    throw new Error(
      `Missing required environment variable "${name}". ` +
        `Set it in your .env.local (see .env.example).`,
    );
  }
  return value;
}
