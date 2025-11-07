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
