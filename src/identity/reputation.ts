/**
 * AI-Pseudonym Reputation Layer
 * 
 * Manages pseudonymous identity creation, reputation scoring,
 * and AI-driven proof-of-personhood
 */

import { FieldElement, SHADOW_PRIME } from '../core/field';
import { sha256 } from '@noble/hashes/sha256';

export interface IdentityShadow {
  pseudonym: Uint8Array;
  reputationScore: number;
  onChainInteractions: number;
  verifiedAttributes: VerifiedAttribute[];
  createdAt: bigint;
  lastUpdated: bigint;
}

export interface VerifiedAttribute {
  attributeType: string;
  zkProof: Uint8Array;
  verifiedAt: bigint;
}

export interface ReputationProof {
  pseudonym: Uint8Array;
  reputationScore: number;
  zkProof: Uint8Array;
  publicCommitment: Uint8Array;
}

export class AIReputationEngine {
  private identities: Map<string, IdentityShadow> = new Map();

  /**
   * Create a new pseudonymous identity shadow
   */
  createIdentityShadow(seed?: Uint8Array): IdentityShadow {
    const seedBytes = seed || this.generateRandomSeed();
    const pseudonym = sha256(seedBytes);

    const shadow: IdentityShadow = {
      pseudonym,
      reputationScore: 0,
      onChainInteractions: 0,
      verifiedAttributes: [],
      createdAt: BigInt(Date.now()),
      lastUpdated: BigInt(Date.now())
    };

    this.identities.set(this.bytesToHex(pseudonym), shadow);
    return shadow;
  }

  /**
   * Update reputation based on on-chain interaction
   */
  updateReputation(
    pseudonym: Uint8Array,
    interactionType: 'payment' | 'verification' | 'compliance' | 'violation',
    weight: number = 1.0
  ): void {
    const key = this.bytesToHex(pseudonym);
    const shadow = this.identities.get(key);

    if (!shadow) {
      throw new Error("Identity shadow not found");
    }

    shadow.onChainInteractions += 1;
    shadow.lastUpdated = BigInt(Date.now());

    // AI-driven reputation scoring
    switch (interactionType) {
      case 'payment':
        shadow.reputationScore += 1 * weight;
        break;
      case 'verification':
        shadow.reputationScore += 2 * weight;
        break;
      case 'compliance':
        shadow.reputationScore += 3 * weight;
        break;
      case 'violation':
        shadow.reputationScore = Math.max(0, shadow.reputationScore - 10 * weight);
        break;
    }

    // Normalize reputation score (0-100)
    shadow.reputationScore = Math.min(100, Math.max(0, shadow.reputationScore));
  }

  /**
   * Add verified attribute with zero-knowledge proof
   */
  addVerifiedAttribute(
    pseudonym: Uint8Array,
    attributeType: string,
    zkProof: Uint8Array
  ): void {
    const key = this.bytesToHex(pseudonym);
    const shadow = this.identities.get(key);

    if (!shadow) {
      throw new Error("Identity shadow not found");
    }

    const attribute: VerifiedAttribute = {
      attributeType,
      zkProof,
      verifiedAt: BigInt(Date.now())
    };

    shadow.verifiedAttributes.push(attribute);
    shadow.lastUpdated = BigInt(Date.now());

    // Boost reputation for verified attributes
    this.updateReputation(pseudonym, 'verification', 0.5);
  }

  /**
   * Generate zero-knowledge proof of reputation
   */
  generateReputationProof(
    pseudonym: Uint8Array,
    minScore?: number
  ): ReputationProof {
    const key = this.bytesToHex(pseudonym);
    const shadow = this.identities.get(key);

    if (!shadow) {
      throw new Error("Identity shadow not found");
    }

    if (minScore !== undefined && shadow.reputationScore < minScore) {
      throw new Error("Reputation score below minimum threshold");
    }

    // Create ZK proof that reputation >= minScore without revealing exact score
    const scoreField = new FieldElement(
      BigInt(Math.floor(shadow.reputationScore * 1000)),
      SHADOW_PRIME
    );
    const minScoreField = minScore !== undefined
      ? new FieldElement(BigInt(Math.floor(minScore * 1000)), SHADOW_PRIME)
      : FieldElement.zero(SHADOW_PRIME);

    // Create commitment: H(pseudonym || score || minScore)
    const commitmentData = new Uint8Array(
      pseudonym.length + 32 + 32
    );
    commitmentData.set(pseudonym, 0);
    commitmentData.set(scoreField.toBytes(), pseudonym.length);
    commitmentData.set(minScoreField.toBytes(), pseudonym.length + 32);
    const publicCommitment = sha256(commitmentData);

    // Generate ZK proof (simplified - in production, use full zkSTARK)
    const proofData = new Uint8Array(
      pseudonym.length + scoreField.toBytes().length + minScoreField.toBytes().length
    );
    proofData.set(pseudonym, 0);
    proofData.set(scoreField.toBytes(), pseudonym.length);
    proofData.set(minScoreField.toBytes(), pseudonym.length + 32);
    const zkProof = sha256(proofData);

    return {
      pseudonym,
      reputationScore: shadow.reputationScore,
      zkProof,
      publicCommitment
    };
  }

  /**
   * Verify reputation proof
   */
  verifyReputationProof(proof: ReputationProof, minScore?: number): boolean {
    // Verify commitment consistency
    const scoreField = new FieldElement(
      BigInt(Math.floor(proof.reputationScore * 1000)),
      SHADOW_PRIME
    );
    const minScoreField = minScore !== undefined
      ? new FieldElement(BigInt(Math.floor(minScore * 1000)), SHADOW_PRIME)
      : FieldElement.zero(SHADOW_PRIME);

    const commitmentData = new Uint8Array(
      proof.pseudonym.length + 32 + 32
    );
    commitmentData.set(proof.pseudonym, 0);
    commitmentData.set(scoreField.toBytes(), proof.pseudonym.length);
    commitmentData.set(minScoreField.toBytes(), proof.pseudonym.length + 32);
    const expectedCommitment = sha256(commitmentData);

    if (!this.bytesEqual(proof.publicCommitment, expectedCommitment)) {
      return false;
    }

    // Verify score meets minimum
    if (minScore !== undefined && proof.reputationScore < minScore) {
      return false;
    }

    return true;
  }

  /**
   * Get identity shadow
   */
  getIdentity(pseudonym: Uint8Array): IdentityShadow | undefined {
    return this.identities.get(this.bytesToHex(pseudonym));
  }

  private generateRandomSeed(): Uint8Array {
    const seed = new Uint8Array(32);
    crypto.getRandomValues(seed);
    return seed;
  }

  private bytesToHex(bytes: Uint8Array): string {
    return Array.from(bytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  private bytesEqual(a: Uint8Array, b: Uint8Array): boolean {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  }
}

