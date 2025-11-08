/**
 * Input Validation Utilities
 *
 * Provides validation helpers for ShadowOS operations
 */

import { ValidationError } from "./errors";

export { ValidationError };

/**
 * Validate that a value is a non-empty Uint8Array
 */
export function validateBytes(
  value: unknown,
  name: string = "bytes",
  minLength: number = 1
): asserts value is Uint8Array {
  if (!(value instanceof Uint8Array)) {
    throw new ValidationError(
      `${name} must be a Uint8Array, got ${typeof value}`,
      name
    );
  }
  if (value.length < minLength) {
    throw new ValidationError(
      `${name} must be at least ${minLength} bytes, got ${value.length}`,
      name
    );
  }
}

/**
 * Validate that a value is a positive bigint
 */
export function validateBigInt(
  value: unknown,
  name: string = "value",
  min?: bigint,
  max?: bigint
): asserts value is bigint {
  if (typeof value !== "bigint") {
    throw new ValidationError(
      `${name} must be a bigint, got ${typeof value}`,
      name
    );
  }
  if (min !== undefined && value < min) {
    throw new ValidationError(
      `${name} must be at least ${min}, got ${value}`,
      name
    );
  }
  if (max !== undefined && value > max) {
    throw new ValidationError(
      `${name} must be at most ${max}, got ${value}`,
      name
    );
  }
}

/**
 * Validate that a value is a non-empty string
 */
export function validateString(
  value: unknown,
  name: string = "string",
  minLength: number = 1
): asserts value is string {
  if (typeof value !== "string") {
    throw new ValidationError(
      `${name} must be a string, got ${typeof value}`,
      name
    );
  }
  if (value.length < minLength) {
    throw new ValidationError(
      `${name} must be at least ${minLength} characters, got ${value.length}`,
      name
    );
  }
}

/**
 * Validate that a value is a non-negative integer
 */
export function validateInteger(
  value: unknown,
  name: string = "integer",
  min?: number,
  max?: number
): asserts value is number {
  if (typeof value !== "number" || !Number.isInteger(value)) {
    throw new ValidationError(
      `${name} must be an integer, got ${typeof value}`,
      name
    );
  }
  if (min !== undefined && value < min) {
    throw new ValidationError(
      `${name} must be at least ${min}, got ${value}`,
      name
    );
  }
  if (max !== undefined && value > max) {
    throw new ValidationError(
      `${name} must be at most ${max}, got ${value}`,
      name
    );
  }
}

/**
 * Validate that a value is a valid stealth address (32 bytes)
 */
export function validateStealthAddress(
  value: unknown,
  name: string = "stealthAddress"
): asserts value is Uint8Array {
  validateBytes(value, name, 32);
  if ((value as Uint8Array).length !== 32) {
    throw new ValidationError(
      `${name} must be exactly 32 bytes, got ${(value as Uint8Array).length}`,
      name
    );
  }
}

/**
 * Validate that a value is a valid hex string
 */
export function validateHexString(
  value: unknown,
  name: string = "hexString"
): asserts value is string {
  validateString(value, name);
  const hexPattern = /^[0-9a-fA-F]+$/;
  if (!hexPattern.test(value as string)) {
    throw new ValidationError(
      `${name} must be a valid hex string`,
      name
    );
  }
}

