/**
 * Finite Field Arithmetic
 *
 * Implements arithmetic operations over a prime field F_p
 * Used for zero-knowledge proof computations
 */

// STARK-friendly prime: 2^251 + 17 * 2^192 + 1
export const SHADOW_PRIME = 2n ** 251n + 17n * 2n ** 192n + 1n;

export class FieldElement {
  constructor(
    public readonly value: bigint,
    public readonly modulus: bigint = SHADOW_PRIME
  ) {
    if (value < 0n || value >= modulus) {
      this.value = this.mod(value, modulus);
    }
  }

  private mod(a: bigint, m: bigint): bigint {
    return ((a % m) + m) % m;
  }

  add(other: FieldElement): FieldElement {
    if (this.modulus !== other.modulus) {
      throw new Error("Cannot add field elements with different moduli");
    }
    return new FieldElement(
      this.mod(this.value + other.value, this.modulus),
      this.modulus
    );
  }

  sub(other: FieldElement): FieldElement {
    if (this.modulus !== other.modulus) {
      throw new Error("Cannot subtract field elements with different moduli");
    }
    return new FieldElement(
      this.mod(this.value - other.value, this.modulus),
      this.modulus
    );
  }

  mul(other: FieldElement): FieldElement {
    if (this.modulus !== other.modulus) {
      throw new Error("Cannot multiply field elements with different moduli");
    }
    return new FieldElement(
      this.mod(this.value * other.value, this.modulus),
      this.modulus
    );
  }

  div(other: FieldElement): FieldElement {
    return this.mul(other.inverse());
  }

  pow(exponent: bigint): FieldElement {
    if (exponent < 0n) {
      return this.inverse().pow(-exponent);
    }
    let result: FieldElement = FieldElement.one(this.modulus);
    let base: FieldElement = this;
    while (exponent > 0n) {
      if (exponent % 2n === 1n) {
        result = result.mul(base);
      }
      base = base.mul(base);
      exponent = exponent / 2n;
    }
    return result;
  }

  inverse(): FieldElement {
    // Extended Euclidean Algorithm
    let [oldR, r] = [this.value, this.modulus];
    let [oldS, s] = [1n, 0n];

    while (r !== 0n) {
      const quotient = oldR / r;
      [oldR, r] = [r, oldR - quotient * r];
      [oldS, s] = [s, oldS - quotient * s];
    }

    if (oldR > 1n) {
      throw new Error("Field element is not invertible");
    }

    return new FieldElement(this.mod(oldS, this.modulus), this.modulus);
  }

  neg(): FieldElement {
    return new FieldElement(this.mod(-this.value, this.modulus), this.modulus);
  }

  equals(other: FieldElement): boolean {
    return this.value === other.value && this.modulus === other.modulus;
  }

  isZero(): boolean {
    return this.value === 0n;
  }

  isOne(): boolean {
    return this.value === 1n;
  }

  toBytes(): Uint8Array {
    const bytes = new Uint8Array(32);
    let val = this.value;
    for (let i = 31; i >= 0; i--) {
      bytes[i] = Number(val & 0xffn);
      val = val >> 8n;
    }
    return bytes;
  }

  static fromBytes(
    bytes: Uint8Array,
    modulus: bigint = SHADOW_PRIME
  ): FieldElement {
    let value = 0n;
    for (let i = 0; i < bytes.length; i++) {
      value = (value << 8n) + BigInt(bytes[i]);
    }
    return new FieldElement(value, modulus);
  }

  static zero(modulus: bigint = SHADOW_PRIME): FieldElement {
    return new FieldElement(0n, modulus);
  }

  static one(modulus: bigint = SHADOW_PRIME): FieldElement {
    return new FieldElement(1n, modulus);
  }

  static random(modulus: bigint = SHADOW_PRIME): FieldElement {
    // Use cryptographically secure random number generation
    const max = modulus - 1n;
    const byteLength = Math.ceil(max.toString(16).length / 2);
    const randomBytes = new Uint8Array(byteLength);
    // Use globalThis.crypto for compatibility
    const cryptoObj = globalThis.crypto || (globalThis as any).crypto;
    if (!cryptoObj || !cryptoObj.getRandomValues) {
      throw new Error("crypto.getRandomValues is not available");
    }
    cryptoObj.getRandomValues(randomBytes);

    // Convert to bigint and ensure it's within range
    let randomValue = 0n;
    for (let i = 0; i < randomBytes.length; i++) {
      randomValue = (randomValue << 8n) + BigInt(randomBytes[i]);
    }

    // Ensure value is within valid range
    randomValue = randomValue % (max + 1n);
    return new FieldElement(randomValue, modulus);
  }
}
