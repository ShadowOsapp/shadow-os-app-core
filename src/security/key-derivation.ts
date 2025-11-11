/**
 * Secure Key Derivation
 *
 * Implements secure key derivation functions for cryptographic operations
 */

import { hkdf } from "@noble/hashes/hkdf";
import { pbkdf2 } from "@noble/hashes/pbkdf2";
import { sha256 } from "@noble/hashes/sha256";

/**
 * Derive key using HKDF (HMAC-based Key Derivation Function)
 * Recommended for most use cases
 */
export function deriveKeyHKDF(
  inputKeyMaterial: Uint8Array,
  salt: Uint8Array,
  info: Uint8Array | string,
  length: number = 32
): Uint8Array {
  const infoBytes =
    typeof info === "string" ? new TextEncoder().encode(info) : info;

  return hkdf(sha256, inputKeyMaterial, salt, infoBytes, length);
}

/**
 * Derive key using PBKDF2 (Password-Based Key Derivation Function 2)
 * Recommended for password-based key derivation
 */
export function deriveKeyPBKDF2(
  password: Uint8Array | string,
  salt: Uint8Array,
  iterations: number = 100000,
  length: number = 32
): Uint8Array {
  const passwordBytes =
    typeof password === "string"
      ? new TextEncoder().encode(password)
      : password;

  return pbkdf2(sha256, passwordBytes, salt, {
    c: iterations,
    dkLen: length,
  });
}

/**
 * Generate secure random salt
 */
export function generateSalt(length: number = 32): Uint8Array {
  const salt = new Uint8Array(length);
  crypto.getRandomValues(salt);
  return salt;
}

/**
 * Derive multiple keys from a single master key
 */
export function deriveMultipleKeys(
  masterKey: Uint8Array,
  salt: Uint8Array,
  keyCount: number,
  keyLength: number = 32
): Uint8Array[] {
  const keys: Uint8Array[] = [];
  for (let i = 0; i < keyCount; i++) {
    const info = new TextEncoder().encode(`key-${i}`);
    const key = deriveKeyHKDF(masterKey, salt, info, keyLength);
    keys.push(key);
  }
  return keys;
}

/**
 * Secure key stretching (increases key entropy)
 */
export function stretchKey(
  key: Uint8Array,
  salt: Uint8Array,
  iterations: number = 10000
): Uint8Array {
  let stretched = key;
  for (let i = 0; i < iterations; i++) {
    stretched = sha256(
      new Uint8Array([...stretched, ...salt, ...new Uint8Array([i])])
    );
  }
  return stretched;
}

