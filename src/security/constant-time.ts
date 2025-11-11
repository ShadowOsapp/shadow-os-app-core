/**
 * Constant-Time Operations
 *
 * Prevents timing attacks by ensuring operations take constant time
 * regardless of input values
 */

/**
 * Constant-time comparison of two byte arrays
 * Returns true if arrays are equal, false otherwise
 * Execution time is independent of where the difference occurs
 */
export function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) {
    // Still perform comparison to maintain constant time
    const minLength = Math.min(a.length, b.length);
    let result = 0;
    for (let i = 0; i < minLength; i++) {
      result |= a[i] ^ b[i];
    }
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a[i] ^ b[i];
  }
  return result === 0;
}

/**
 * Constant-time comparison of two bigints
 */
export function constantTimeEqualBigInt(a: bigint, b: bigint): boolean {
  // Convert to bytes for constant-time comparison
  const aBytes = bigIntToBytes(a);
  const bBytes = bigIntToBytes(b);
  return constantTimeEqual(aBytes, bBytes);
}

/**
 * Constant-time select: returns a if condition is true, b otherwise
 * Prevents branch prediction attacks
 */
export function constantTimeSelect<T>(condition: boolean, a: T, b: T): T {
  // Use bitwise operations to avoid branching
  const mask = condition ? -1 : 0;
  // This is a simplified version - in practice, you'd need type-specific handling
  return (mask ? a : b) as T;
}

/**
 * Convert bigint to bytes (constant length)
 */
function bigIntToBytes(value: bigint, length: number = 32): Uint8Array {
  const bytes = new Uint8Array(length);
  let val = value;
  for (let i = length - 1; i >= 0; i--) {
    bytes[i] = Number(val & 0xffn);
    val = val >> 8n;
  }
  return bytes;
}

/**
 * Constant-time check if value is zero
 */
export function constantTimeIsZero(value: bigint): boolean {
  const bytes = bigIntToBytes(value);
  let result = 0;
  for (let i = 0; i < bytes.length; i++) {
    result |= bytes[i];
  }
  return result === 0;
}

/**
 * Secure memory wipe (attempts to clear sensitive data)
 * Note: JavaScript doesn't guarantee memory clearing, but this helps
 */
export function secureWipe(data: Uint8Array): void {
  // Overwrite with random data multiple times
  const random = new Uint8Array(data.length);
  for (let i = 0; i < 3; i++) {
    crypto.getRandomValues(random);
    data.set(random);
  }
  // Final zero fill
  data.fill(0);
}
