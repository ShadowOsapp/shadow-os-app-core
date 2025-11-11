/**
 * ShadowOS Core
 *
 * Privacy-first payment operating system with zero-knowledge cryptography
 * and AI-verified identity
 */

// Core cryptographic primitives
export { FieldElement, SHADOW_PRIME } from "./core/field";
export { Polynomial } from "./core/polynomial";
export { MerkleTree, MerkleProof } from "./core/merkle";

// Error classes
export {
  ShadowOSError,
  ValidationError,
  CryptoError,
  ProofError,
  ReputationError,
  MerchantError,
} from "./core/errors";

// Validation utilities
export * from "./core/validation";

// Utilities
export * from "./utils/cross-chain";
export * from "./utils/benchmark";
export * from "./utils/storage";
export * from "./utils/rate-limit";

// Security
export * from "./security/constant-time";
export * from "./security/key-derivation";
export * from "./security/sanitization";
export * from "./security/audit";
export * from "./security/secure-random";
export * from "./security/headers";

// Zero-Knowledge x402 Stealth Payments
export {
  X402StealthPayment,
  StealthPayment,
  StealthProof,
  ZKProof,
} from "./zk/x402";

// AI-Pseudonym Reputation Layer
export {
  AIReputationEngine,
  IdentityShadow,
  VerifiedAttribute,
  ReputationProof,
} from "./identity/reputation";

// Private Merchant Bridge
export {
  PrivateMerchantBridge,
  MerchantConfig,
  PrivateInvoice,
  PaymentReceipt,
} from "./bridge/merchant";
