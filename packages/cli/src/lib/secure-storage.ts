/**
 * Encrypted token storage using AES-256-GCM.
 *
 * Encrypts PAT tokens at rest so they are never stored in plaintext.
 * The encryption key is derived from machine-specific data via PBKDF2.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import fsp from "node:fs/promises";
import os from "node:os";

const ALGORITHM = "aes-256-gcm";
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const PBKDF2_ITERATIONS = 100_000;
const PBKDF2_SALT = "bugspark-cli-v1";

function deriveKey(): Buffer {
  const material = [
    os.hostname(),
    os.userInfo().username,
    os.platform(),
    "bugspark-cli",
  ].join(":");
  return crypto.pbkdf2Sync(
    material,
    PBKDF2_SALT,
    PBKDF2_ITERATIONS,
    KEY_LENGTH,
    "sha256",
  );
}

export function encryptToken(token: string): string {
  const key = deriveKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([
    cipher.update(token, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  // Pack: iv (16) + authTag (16) + ciphertext
  const combined = Buffer.concat([iv, authTag, encrypted]);
  return combined.toString("base64");
}

export function decryptToken(encoded: string): string {
  const key = deriveKey();
  const combined = Buffer.from(encoded, "base64");

  const iv = combined.subarray(0, IV_LENGTH);
  const authTag = combined.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const encrypted = combined.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}

/**
 * Detect whether a stored token value is plaintext (legacy) or encrypted.
 * PAT tokens always start with `bsk_pat_`; encrypted values are base64.
 */
export function isPlaintextToken(value: string): boolean {
  return value.startsWith("bsk_pat_");
}

/**
 * Overwrite a file with random bytes before unlinking to prevent
 * recovery from disk.
 */
export async function secureDelete(filePath: string): Promise<void> {
  if (!fs.existsSync(filePath)) return;

  const stat = fs.statSync(filePath);
  const size = stat.size;

  if (size > 0) {
    const handle = await fsp.open(filePath, "r+");
    await handle.write(crypto.randomBytes(size), 0, size, 0);
    await handle.close();
  }

  await fsp.unlink(filePath);
}
