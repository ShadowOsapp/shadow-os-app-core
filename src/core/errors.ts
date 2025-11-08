/**
 * Custom Error Classes for ShadowOS
 *
 * Provides structured error handling throughout the ShadowOS codebase
 */

/**
 * Base error class for all ShadowOS errors
 */
export class ShadowOSError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = "ShadowOSError";
    Object.setPrototypeOf(this, ShadowOSError.prototype);
  }
}

/**
 * Validation error for invalid input
 */
export class ValidationError extends ShadowOSError {
  constructor(message: string, public readonly field?: string, cause?: Error) {
    super(message, "VALIDATION_ERROR", cause);
    this.name = "ValidationError";
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * Cryptographic operation error
 */
export class CryptoError extends ShadowOSError {
  constructor(message: string, cause?: Error) {
    super(message, "CRYPTO_ERROR", cause);
    this.name = "CryptoError";
    Object.setPrototypeOf(this, CryptoError.prototype);
  }
}

/**
 * Proof verification error
 */
export class ProofError extends ShadowOSError {
  constructor(message: string, cause?: Error) {
    super(message, "PROOF_ERROR", cause);
    this.name = "ProofError";
    Object.setPrototypeOf(this, ProofError.prototype);
  }
}

/**
 * Reputation system error
 */
export class ReputationError extends ShadowOSError {
  constructor(message: string, cause?: Error) {
    super(message, "REPUTATION_ERROR", cause);
    this.name = "ReputationError";
    Object.setPrototypeOf(this, ReputationError.prototype);
  }
}

/**
 * Merchant bridge error
 */
export class MerchantError extends ShadowOSError {
  constructor(message: string, cause?: Error) {
    super(message, "MERCHANT_ERROR", cause);
    this.name = "MerchantError";
    Object.setPrototypeOf(this, MerchantError.prototype);
  }
}

