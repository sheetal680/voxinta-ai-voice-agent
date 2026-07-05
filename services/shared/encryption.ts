import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "node:crypto";
import { requireEnv } from "./env";

/**
 * At-rest encryption for user-supplied secrets (BYO-provider API keys —
 * see features/settings). AES-256-GCM with a per-record random salt/IV: the
 * salt lets each record derive its own key from the master secret (so
 * compromising one derived key doesn't help with another), and GCM's auth
 * tag detects tampering/corruption on decrypt rather than silently
 * returning garbage.
 *
 * SERVER-ONLY: reads API_KEY_ENCRYPTION_SECRET. Never import from a client
 * component.
 */
const ALGORITHM = "aes-256-gcm";
const KEY_LENGTH = 32;
const SALT_LENGTH = 16;
const IV_LENGTH = 12; // recommended nonce size for GCM

function deriveKey(salt: Buffer): Buffer {
  const secret = requireEnv("API_KEY_ENCRYPTION_SECRET");
  return scryptSync(secret, salt, KEY_LENGTH);
}

/** Encrypts `plaintext`, returning a single "salt.iv.authTag.ciphertext" string (each base64). */
export function encryptSecret(plaintext: string): string {
  const salt = randomBytes(SALT_LENGTH);
  const iv = randomBytes(IV_LENGTH);
  const key = deriveKey(salt);

  const cipher = createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return [salt, iv, authTag, ciphertext].map((part) => part.toString("base64")).join(".");
}

/** Reverses `encryptSecret`. Throws if the payload is malformed or the auth tag doesn't match. */
export function decryptSecret(payload: string): string {
  const [saltB64, ivB64, authTagB64, ciphertextB64] = payload.split(".");
  if (!saltB64 || !ivB64 || !authTagB64 || !ciphertextB64) {
    throw new Error("Malformed encrypted payload.");
  }

  const salt = Buffer.from(saltB64, "base64");
  const iv = Buffer.from(ivB64, "base64");
  const authTag = Buffer.from(authTagB64, "base64");
  const ciphertext = Buffer.from(ciphertextB64, "base64");
  const key = deriveKey(salt);

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
}

/**
 * Last 4 characters of a secret, for display (as e.g. "•••• ab12") without
 * ever re-exposing the full value. The caller is responsible for the
 * masking prefix — this just returns the trailing characters to reveal.
 */
export function previewSecret(plaintext: string): string {
  return plaintext.slice(-4);
}
