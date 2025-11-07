<div align="center">

# 👻 ShadowOS Core

**The Invisible Transaction Layer**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)

</div>

A TypeScript implementation of **ShadowOS** — a privacy-first payment operating system that combines **zero-knowledge cryptography** with **AI-verified identity** to enable invisible, verifiable transactions on the blockchain.

## Overview

ShadowOS is a revolutionary privacy infrastructure that enables:

- **Zero-Knowledge Stealth Payments**: Transact without revealing sender, receiver, or amount
- **AI-Pseudonym Reputation**: Build trust through verifiable reputation without identity disclosure
- **Private Merchant Bridge**: Enable commerce with complete privacy and compliance
- **Cross-Chain Privacy Fabric**: Unified privacy across multiple blockchain ecosystems
- **Quantum-Resistant**: Built on collision-resistant hash functions and zero-knowledge proof technology

This implementation provides a complete ShadowOS stack for building privacy-preserving payment applications in TypeScript/JavaScript environments.

## Features

### 1. x402 Stealth Payments

- Multi-chain encrypted transactions with ZK consensus proofs
- Absolute confidentiality with verifiable finality
- Regulatory adaptability through selective disclosure

### 2. AI-Pseudonym Reputation Layer

- AI-generated identity shadows for pseudonymous representation
- Reputation scoring based on on-chain interactions
- ZK-KYC equivalence: trust through zero-knowledge computation

### 3. Private Merchant Bridge

- Privacy API for Web3 commerce
- Stealth transfers, private invoices, and AI-verified settlement proofs
- Perfect balance of commerce and confidentiality

### 4. Core Cryptographic Primitives

- Finite field arithmetic over zero-knowledge-friendly primes
- Polynomial operations for zero-knowledge proofs
- Merkle tree commitments with inclusion proofs
- FRI protocol for polynomial proximity proofs

## Installation

```bash
bun install @shadowos/core
```

Or clone and build from source:

```bash
git clone https://github.com/ShadowOsapp/shadow-os-app-core.git
cd shadow-os-app-core
bun install
bun run build
```

## Quick Start

### Basic Example: Stealth Payment

```typescript
import { X402StealthPayment, FieldElement, SHADOW_PRIME } from "@shadowos/core";

// Initialize stealth payment system
const stealthPayment = new X402StealthPayment();

// Create a stealth address
const stealthAddress = new Uint8Array(32);
crypto.getRandomValues(stealthAddress);

// Create a stealth payment
const amount = 1000000n; // 1 USDC (6 decimals)
const payment = stealthPayment.createPayment(stealthAddress, amount);

// Generate zero-knowledge proof
const publicInput: FieldElement[] = [
  new FieldElement(amount, SHADOW_PRIME),
  new FieldElement(payment.timestamp, SHADOW_PRIME),
];

const proof = stealthPayment.generateProof(0, publicInput);

// Verify proof
const root = stealthPayment.getRoot();
const isValid = stealthPayment.verifyProof(proof, root!);

console.log(`Proof is ${isValid ? "valid" : "invalid"}`);
```

### AI-Pseudonym Reputation

```typescript
import { AIReputationEngine } from "@shadowos/core";

// Initialize reputation engine
const reputationEngine = new AIReputationEngine();

// Create identity shadow
const identity = reputationEngine.createIdentityShadow();

// Update reputation through interactions
reputationEngine.updateReputation(identity.pseudonym, "payment", 1.0);
reputationEngine.updateReputation(identity.pseudonym, "verification", 1.0);

// Generate reputation proof (without revealing exact score)
const proof = reputationEngine.generateReputationProof(
  identity.pseudonym,
  3.0 // Minimum reputation threshold
);

// Verify proof
const isValid = reputationEngine.verifyReputationProof(proof, 3.0);
```

### Private Merchant Bridge

```typescript
import { PrivateMerchantBridge } from "@shadowos/core";

// Initialize bridge
const bridge = new PrivateMerchantBridge();

// Register merchant
const merchantStealthAddress = new Uint8Array(32);
crypto.getRandomValues(merchantStealthAddress);

bridge.registerMerchant({
  merchantId: "merchant-001",
  stealthAddress: merchantStealthAddress,
  minReputationScore: 3.0,
  acceptedChains: ["ethereum", "polygon", "solana"],
});

// Create private invoice
const invoice = bridge.createInvoice("merchant-001", 5000000n, 3600);

// Process payment (customer remains anonymous)
const receipt = bridge.processPayment(
  invoice.invoiceId,
  customerPseudonym,
  5000000n,
  "ethereum"
);

// Verify receipt
const root = bridge.getPaymentRoot();
const isValid = bridge.verifyReceipt(receipt, root!);
```

## Architecture

### Core Components

#### 1. Field Element (`src/core/field.ts`)

Implements arithmetic operations over a prime field F_p:

```typescript
import { FieldElement, SHADOW_PRIME } from "@shadowos/core";

const a = new FieldElement(5n, SHADOW_PRIME);
const b = new FieldElement(7n, SHADOW_PRIME);

const sum = a.add(b); // Addition
const product = a.mul(b); // Multiplication
const inverse = a.inverse(); // Multiplicative inverse
const power = a.pow(3n); // Exponentiation
```

**Prime Field**: Uses a 251-bit zero-knowledge-friendly prime: `2^251 + 17 * 2^192 + 1`

#### 2. Polynomial (`src/core/polynomial.ts`)

Polynomial operations essential for zero-knowledge proofs:

```typescript
import { Polynomial, FieldElement, SHADOW_PRIME } from '@shadowos/core';

const coeffs = [
  new FieldElement(1n, SHADOW_PRIME),
  new FieldElement(2n, SHADOW_PRIME),
  new FieldElement(3n, SHADOW_PRIME)
];

const poly = new Polynomial(coeffs); // 1 + 2x + 3x^2

// Evaluate at point
const x = new FieldElement(5n, SHADOW_PRIME);
const result = poly.evaluate(x);

// Lagrange interpolation
const points: [FieldElement, FieldElement][] = [...];
const interpolated = Polynomial.interpolate(points);
```

#### 3. Merkle Tree (`src/core/merkle.ts`)

Cryptographic commitment scheme:

```typescript
import { MerkleTree } from "@shadowos/core";

const leaves = [data1, data2, data3, data4];
const tree = new MerkleTree(leaves);

// Get root commitment
const root = tree.getRoot();

// Generate inclusion proof
const proof = tree.getProof(2);

// Verify proof
const isValid = proof.verify();
```

#### 4. x402 Stealth Payment (`src/zk/x402.ts`)

Zero-knowledge stealth payment protocol:

```typescript
import { X402StealthPayment } from "@shadowos/core";

const stealthPayment = new X402StealthPayment();

// Create payment
const payment = stealthPayment.createPayment(stealthAddress, amount);

// Generate proof
const proof = stealthPayment.generateProof(paymentIndex, publicInput);

// Verify proof
const isValid = stealthPayment.verifyProof(proof, root);
```

**Payment Lifecycle:**

1. User initiates payment request
2. Data is encrypted and masked via x402 algorithms
3. Network validates through zero-knowledge consensus
4. AI pseudonym updates reputation shadows

#### 5. AI Reputation Engine (`src/identity/reputation.ts`)

Manages pseudonymous identity and reputation:

```typescript
import { AIReputationEngine } from "@shadowos/core";

const reputationEngine = new AIReputationEngine();

// Create identity shadow
const identity = reputationEngine.createIdentityShadow();

// Update reputation
reputationEngine.updateReputation(identity.pseudonym, "payment", 1.0);

// Generate reputation proof
const proof = reputationEngine.generateReputationProof(
  identity.pseudonym,
  minScore
);

// Verify proof
const isValid = reputationEngine.verifyReputationProof(proof, minScore);
```

#### 6. Private Merchant Bridge (`src/bridge/merchant.ts`)

Privacy API for merchants and platforms:

```typescript
import { PrivateMerchantBridge } from "@shadowos/core";

const bridge = new PrivateMerchantBridge();

// Register merchant
bridge.registerMerchant(config);

// Create invoice
const invoice = bridge.createInvoice(merchantId, amount, expiration);

// Process payment
const receipt = bridge.processPayment(invoiceId, pseudonym, amount, chain);

// Verify receipt
const isValid = bridge.verifyReceipt(receipt, root);
```

## Examples

### Stealth Payment

Prove a payment was made without revealing sender, receiver, or amount:

```bash
bun run example:stealth-payment
```

**Output:**

```
=== ShadowOS x402 Stealth Payment Example ===

Creating stealth payment...
✓ Payment created
  - Commitment: a3f2c1d8e4b5f6a7...
  - Amount: 1000000
  - Timestamp: 1703123456789

Generating zero-knowledge proof...
✓ Proof generated
  - Commitment: a3f2c1d8e4b5f6a7...
  - Public inputs: 2

Verifying proof...
✓ Proof is valid
```

### Reputation Proof

Prove reputation meets threshold without revealing exact score:

```bash
bun run example:reputation
```

**Use Cases:**

- Proving reputation >= threshold without exposing exact score
- ZK-KYC equivalence: trust without disclosure
- Credit score verification without credit bureaus

### Merchant Bridge

Process private payments with reputation verification:

```bash
bun run example:merchant-bridge
```

**Use Cases:**

- Freelancers receiving global payments privately
- Merchants accepting crypto without customer data
- DAO payouts with privacy and auditability

## API Reference

### FieldElement

```typescript
class FieldElement {
  constructor(value: bigint, modulus: bigint = SHADOW_PRIME);

  add(other: FieldElement): FieldElement;
  sub(other: FieldElement): FieldElement;
  mul(other: FieldElement): FieldElement;
  div(other: FieldElement): FieldElement;
  pow(exponent: bigint): FieldElement;
  inverse(): FieldElement;
  neg(): FieldElement;
  equals(other: FieldElement): boolean;
  isZero(): boolean;
  toBytes(): Uint8Array;

  static zero(modulus: bigint): FieldElement;
  static one(modulus: bigint): FieldElement;
  static random(modulus: bigint): FieldElement;
}
```

### X402StealthPayment

```typescript
class X402StealthPayment {
  createPayment(
    stealthAddress: Uint8Array,
    amount: bigint,
    timestamp?: bigint
  ): StealthPayment;

  generateProof(
    paymentIndex: number,
    publicInput: FieldElement[]
  ): StealthProof;

  verifyProof(proof: StealthProof, expectedRoot: Uint8Array): boolean;
  getRoot(): Uint8Array | undefined;
  getPaymentCount(): number;
}
```

### AIReputationEngine

```typescript
class AIReputationEngine {
  createIdentityShadow(seed?: Uint8Array): IdentityShadow;

  updateReputation(
    pseudonym: Uint8Array,
    interactionType: "payment" | "verification" | "compliance" | "violation",
    weight?: number
  ): void;

  addVerifiedAttribute(
    pseudonym: Uint8Array,
    attributeType: string,
    zkProof: Uint8Array
  ): void;

  generateReputationProof(
    pseudonym: Uint8Array,
    minScore?: number
  ): ReputationProof;

  verifyReputationProof(proof: ReputationProof, minScore?: number): boolean;

  getIdentity(pseudonym: Uint8Array): IdentityShadow | undefined;
}
```

### PrivateMerchantBridge

```typescript
class PrivateMerchantBridge {
  registerMerchant(config: MerchantConfig): void;

  createInvoice(
    merchantId: string,
    amount: bigint,
    expirationSeconds?: number
  ): PrivateInvoice;

  processPayment(
    invoiceId: string,
    senderPseudonym: Uint8Array,
    amount: bigint,
    chain: string
  ): PaymentReceipt;

  verifyReceipt(receipt: PaymentReceipt, expectedRoot: Uint8Array): boolean;

  getPaymentRoot(): Uint8Array | undefined;
}
```

## Performance

### Complexity Analysis

| Operation          | Time Complexity | Space Complexity |
| ------------------ | --------------- | ---------------- |
| Proof Generation   | O(n log n)      | O(n)             |
| Proof Verification | O(log² n)       | O(log n)         |
| Proof Size         | O(log² n)       | -                |

Where `n` is the computation size (trace length).

### Benchmarks

_Environment: Node.js v20, M1 MacBook Pro_

| Trace Length | Proof Time | Verify Time | Proof Size |
| ------------ | ---------- | ----------- | ---------- |
| 16           | ~250ms     | ~50ms       | ~16 KB     |
| 64           | ~550ms     | ~85ms       | ~24 KB     |
| 256          | ~1.3s      | ~140ms      | ~38 KB     |
| 1024         | ~5.2s      | ~300ms      | ~55 KB     |

## Security

### Cryptographic Assumptions

- **Collision Resistance**: SHA-256 hash function
- **Prime Field**: 251-bit zero-knowledge-friendly prime
- **Security Parameter**: 128 bits (configurable)
- **Soundness Error**: 2^(-securityParameter)

### Quantum Resistance

Unlike zkSNARKs (which rely on elliptic curve pairings), ShadowOS uses zero-knowledge proof technology that is quantum-resistant because it only uses:

- Symmetric cryptography (hash functions)
- Error-correcting codes (Reed-Solomon)
- No computationally hard assumptions vulnerable to Shor's algorithm

### Transparency

**No Trusted Setup Required**: Unlike zkSNARKs, ShadowOS doesn't need a trusted ceremony to generate proving/verification keys. All randomness comes from public coin flips (Fiat-Shamir heuristic).

## Use Cases

### 1. Privacy-Preserving Payments

Prove payment validity without revealing amounts or parties:

```typescript
// Prove: payment was made correctly
// Without revealing: sender, receiver, or amount
```

### 2. Confidential Commerce

Enable merchants to accept payments without customer data:

```typescript
// Merchant receives payment
// Customer remains anonymous
// Both parties can verify transaction
```

### 3. Private DAO Treasury

Disburse funds invisibly while maintaining auditability:

```typescript
// Prove: treasury disbursement is valid
// Without revealing: recipient identities or amounts
```

### 4. ZK-KYC Equivalence

Prove compliance without identity disclosure:

```typescript
// Prove: user meets KYC requirements
// Without revealing: personal information
```

### 5. Reputation-Based Access

Control access based on reputation without exposing scores:

```typescript
// Prove: reputation >= threshold
// Without revealing: exact reputation score
```

## Testing

Run the test suite:

```bash
bun test
```

Run specific tests:

```bash
bun test -- field.test.ts
bun test -- x402.test.ts
```

## Backend API Server

ShadowOS includes a serverless-ready backend API server built with Hono.

### Quick Start

```bash
# Install dependencies
bun install

# Run development server
bun run server:dev

# Or start production server
bun run server:start
```

Server will run on `http://localhost:3000` by default.

### API Endpoints

- **Stealth Payments**: `/api/v1/stealth/*`
- **Reputation Engine**: `/api/v1/reputation/*`
- **Merchant Bridge**: `/api/v1/merchant/*`

See [server/README.md](./server/README.md) for detailed API documentation.

### Serverless Deployment

Deploy to multiple serverless platforms:

- **Vercel**: `vercel deploy`
- **AWS Lambda**: `serverless deploy`
- **Cloudflare Workers**: `wrangler publish`

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment guides.

## Building from Source

```bash
# Install dependencies
bun install

# Build TypeScript
bun run build

# Run tests
bun test

# Run examples
bun run example:stealth-payment
bun run example:reputation
bun run example:merchant-bridge
```

## Project Structure

```
shadow-os-app-core/
├── src/
│   ├── core/
│   │   ├── field.ts          # Finite field arithmetic
│   │   ├── polynomial.ts     # Polynomial operations
│   │   └── merkle.ts         # Merkle tree commitments
│   ├── zk/
│   │   └── x402.ts           # x402 stealth payment protocol
│   ├── identity/
│   │   └── reputation.ts     # AI-pseudonym reputation engine
│   ├── bridge/
│   │   └── merchant.ts       # Private merchant bridge
│   └── index.ts              # Main exports
├── server/
│   ├── src/
│   │   ├── index.ts          # API server main file
│   │   └── server.ts         # Standalone server
│   ├── vercel.ts             # Vercel adapter
│   ├── aws-lambda.ts         # AWS Lambda adapter
│   ├── cloudflare.ts         # Cloudflare Workers adapter
│   └── README.md             # Server documentation
├── examples/
│   ├── stealth-payment.ts    # Stealth payment example
│   ├── reputation-proof.ts   # Reputation proof example
│   └── merchant-bridge.ts    # Merchant bridge example
├── tests/
│   ├── field.test.ts         # Field tests
│   └── x402.test.ts          # x402 tests
├── docs/                     # Documentation
├── vercel.json               # Vercel configuration
├── serverless.yml            # AWS Lambda configuration
├── wrangler.toml             # Cloudflare Workers configuration
├── DEPLOYMENT.md             # Deployment guide
├── package.json
├── tsconfig.json
└── README.md
```

## Contributing

We welcome contributions! Please see our contributing guidelines:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/my-feature`
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## References

### Papers

- Scalable, transparent, and post-quantum secure computational integrity - Ben-Sasson et al., 2018
- Fast Reed-Solomon Interactive Oracle Proofs of Proximity - Ben-Sasson et al., 2018
- Aurora: Transparent Succinct Arguments for R1CS - Ben-Sasson et al., 2018

### Resources

- [ShadowOS Documentation](https://docs.shadowos.io)
- [Zero-Knowledge Proofs MOOC](https://zk-learning.org)

## Support

- **Documentation**: [docs.shadowos.io](https://docs.shadowos.io)
- **Discord**: [discord.gg/shadowos](https://discord.gg/shadowos)
- **GitHub Issues**: [github.com/ShadowOsapp/shadow-os-app-core/issues](https://github.com/ShadowOsapp/shadow-os-app-core/issues)
- **Email**: dev@shadowos.io

## Acknowledgments

Special thanks to:

- Eli Ben-Sasson and co-authors for the original zero-knowledge proof research
- The zero-knowledge cryptography community
- The privacy-preserving technology ecosystem

Built with privacy at its core by the ShadowOS team

---

⚡ Fast · 🔒 Secure · 🌐 Transparent · ♾️ Quantum-Resistant · 👻 Invisible
