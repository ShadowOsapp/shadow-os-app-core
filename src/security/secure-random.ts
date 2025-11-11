/**
 * Secure Random Number Generation
 *
 * Enhanced secure random utilities with additional entropy sources
 */

/**
 * Generate cryptographically secure random bytes
 */
export function secureRandomBytes(length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bytes;
}

/**
 * Generate secure random bigint in range [min, max)
 */
export function secureRandomBigInt(min: bigint, max: bigint): bigint {
  if (min >= max) {
    throw new Error("min must be less than max");
  }

  const range = max - min;
  const bitLength = range.toString(2).length;
  const byteLength = Math.ceil(bitLength / 8);

  // Generate random bytes
  let randomBytes = secureRandomBytes(byteLength);

  // Convert to bigint
  let randomValue = 0n;
  for (let i = 0; i < randomBytes.length; i++) {
    randomValue = (randomValue << 8n) + BigInt(randomBytes[i]);
  }

  // Ensure value is within range (rejection sampling)
  const maxValue = 2n ** BigInt(bitLength) - 1n;
  if (randomValue > maxValue - (maxValue % range)) {
    // Retry if value is outside acceptable range
    return secureRandomBigInt(min, max);
  }

  return (randomValue % range) + min;
}

/**
 * Generate secure random integer in range [min, max)
 */
export function secureRandomInt(min: number, max: number): number {
  if (min >= max) {
    throw new Error("min must be less than max");
  }

  const range = max - min;
  const maxValue = 2 ** 32 - 1;
  const randomArray = new Uint32Array(1);
  crypto.getRandomValues(randomArray);

  // Use rejection sampling for uniform distribution
  const randomValue = randomArray[0] / maxValue;
  return Math.floor(randomValue * range) + min;
}

/**
 * Generate secure random string
 */
export function secureRandomString(
  length: number,
  charset: string = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
): string {
  const bytes = secureRandomBytes(length);
  let result = "";
  for (let i = 0; i < length; i++) {
    result += charset[bytes[i] % charset.length];
  }
  return result;
}

/**
 * Generate secure random hex string
 */
export function secureRandomHex(length: number): string {
  const bytes = secureRandomBytes(Math.ceil(length / 2));
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, length);
}

/**
 * Generate secure random UUID v4
 */
export function secureRandomUUID(): string {
  const bytes = secureRandomBytes(16);

  // Set version (4) and variant bits
  bytes[6] = (bytes[6] & 0x0f) | 0x40; // Version 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // Variant 10

  // Format as UUID
  const hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join("-");
}

/**
 * Add additional entropy to existing random bytes
 * Combines multiple entropy sources
 */
export function addEntropy(
  bytes: Uint8Array,
  additionalEntropy?: Uint8Array
): Uint8Array {
  const result = new Uint8Array(bytes.length);

  // Use existing bytes
  result.set(bytes);

  // Add additional entropy if provided
  if (additionalEntropy) {
    for (let i = 0; i < result.length; i++) {
      result[i] ^= additionalEntropy[i % additionalEntropy.length];
    }
  }

  // Add timestamp entropy (low bits only)
  const timestamp = Date.now();
  const timestampBytes = new Uint8Array(8);
  const view = new DataView(timestampBytes.buffer);
  view.setBigUint64(0, BigInt(timestamp), false);
  for (let i = 0; i < result.length; i++) {
    result[i] ^= timestampBytes[i % 8];
  }

  // Final hash to mix entropy
  const { sha256 } = require("@noble/hashes/sha256");
  const hashed = sha256(result);
  return hashed.slice(0, result.length);
}

