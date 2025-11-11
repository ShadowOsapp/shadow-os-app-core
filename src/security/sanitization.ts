/**
 * Input Sanitization
 *
 * Utilities for sanitizing and validating user input to prevent injection attacks
 */

import { ValidationError } from "../core/errors";

/**
 * Sanitize string input (remove dangerous characters)
 */
export function sanitizeString(
  input: string,
  maxLength: number = 1000
): string {
  if (typeof input !== "string") {
    throw new ValidationError("Input must be a string");
  }

  // Truncate to max length
  let sanitized = input.slice(0, maxLength);

  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, "");

  // Remove control characters except newline and tab
  sanitized = sanitized.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, "");

  return sanitized.trim();
}

/**
 * Sanitize hex string
 */
export function sanitizeHexString(input: string): string {
  if (typeof input !== "string") {
    throw new ValidationError("Input must be a string");
  }

  // Remove whitespace
  let sanitized = input.replace(/\s/g, "");

  // Remove 0x prefix if present
  sanitized = sanitized.replace(/^0x/i, "");

  // Validate hex characters
  if (!/^[0-9a-fA-F]*$/.test(sanitized)) {
    throw new ValidationError("Invalid hex string");
  }

  return sanitized.toLowerCase();
}

/**
 * Sanitize integer input
 */
export function sanitizeInteger(
  input: string | number,
  min?: number,
  max?: number
): number {
  let num: number;

  if (typeof input === "string") {
    // Remove whitespace and validate
    const cleaned = input.trim();
    if (!/^-?\d+$/.test(cleaned)) {
      throw new ValidationError("Invalid integer format");
    }
    num = parseInt(cleaned, 10);
  } else if (typeof input === "number") {
    if (!Number.isInteger(input)) {
      throw new ValidationError("Input must be an integer");
    }
    num = input;
  } else {
    throw new ValidationError("Input must be a string or number");
  }

  if (min !== undefined && num < min) {
    throw new ValidationError(`Value must be at least ${min}`);
  }

  if (max !== undefined && num > max) {
    throw new ValidationError(`Value must be at most ${max}`);
  }

  return num;
}

/**
 * Sanitize bigint input
 */
export function sanitizeBigInt(
  input: string | number | bigint,
  min?: bigint,
  max?: bigint
): bigint {
  let num: bigint;

  if (typeof input === "string") {
    const cleaned = input.trim();
    if (!/^-?\d+$/.test(cleaned)) {
      throw new ValidationError("Invalid bigint format");
    }
    num = BigInt(cleaned);
  } else if (typeof input === "number") {
    if (!Number.isInteger(input)) {
      throw new ValidationError("Input must be an integer");
    }
    num = BigInt(input);
  } else if (typeof input === "bigint") {
    num = input;
  } else {
    throw new ValidationError("Input must be a string, number, or bigint");
  }

  if (min !== undefined && num < min) {
    throw new ValidationError(`Value must be at least ${min}`);
  }

  if (max !== undefined && num > max) {
    throw new ValidationError(`Value must be at most ${max}`);
  }

  return num;
}

/**
 * Sanitize array input
 */
export function sanitizeArray<T>(
  input: unknown,
  validator: (item: unknown) => T,
  maxLength: number = 1000
): T[] {
  if (!Array.isArray(input)) {
    throw new ValidationError("Input must be an array");
  }

  if (input.length > maxLength) {
    throw new ValidationError(`Array length exceeds maximum of ${maxLength}`);
  }

  return input.map((item, index) => {
    try {
      return validator(item);
    } catch (error) {
      throw new ValidationError(
        `Invalid item at index ${index}: ${error instanceof Error ? error.message : "unknown error"}`
      );
    }
  });
}

/**
 * Sanitize object input (whitelist approach)
 */
export function sanitizeObject<T extends Record<string, unknown>>(
  input: unknown,
  schema: Record<string, (value: unknown) => unknown>
): T {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    throw new ValidationError("Input must be an object");
  }

  const result: Record<string, unknown> = {};
  const inputObj = input as Record<string, unknown>;

  for (const [key, validator] of Object.entries(schema)) {
    if (key in inputObj) {
      try {
        result[key] = validator(inputObj[key]);
      } catch (error) {
        throw new ValidationError(
          `Invalid value for field '${key}': ${error instanceof Error ? error.message : "unknown error"}`
        );
      }
    }
  }

  return result as T;
}

/**
 * Escape HTML special characters
 */
export function escapeHtml(input: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return input.replace(/[&<>"']/g, (m) => map[m]);
}

/**
 * Validate and sanitize URL
 */
export function sanitizeUrl(input: string, allowedProtocols: string[] = ["https:", "http:"]): string {
  try {
    const url = new URL(input);
    if (!allowedProtocols.includes(url.protocol)) {
      throw new ValidationError(`Protocol ${url.protocol} is not allowed`);
    }
    return url.toString();
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    throw new ValidationError("Invalid URL format");
  }
}

