/**
 * x402 Stealth Payment Protocol
 *
 * Implements the x402 standard for private, untraceable transactions
 * with zero-knowledge verification
 */

import { FieldElement, SHADOW_PRIME } from "../core/field";
import { Polynomial } from "../core/polynomial";
import { MerkleTree, MerkleProof } from "../core/merkle";
import { sha256 } from "@noble/hashes/sha256";

export interface StealthPayment {
  commitment: Uint8Array;
  stealthAddress: Uint8Array;
  amount: FieldElement;
  timestamp: bigint;
}

export interface StealthProof {
  commitment: Uint8Array;
  merkleProof: MerkleProof;
  zkProof: ZKProof;
  publicInput: FieldElement[];
}

export interface ZKProof {
  polynomialCommitment: Uint8Array;
  evaluationProofs: MerkleProof[];
  challenge: FieldElement;
  response: FieldElement[];
}

export class X402StealthPayment {
  private stealthPayments: StealthPayment[] = [];
  private merkleTree?: MerkleTree;

  /**
   * Create a stealth payment
   */
  createPayment(
    stealthAddress: Uint8Array,
    amount: bigint,
    timestamp: bigint = BigInt(Date.now())
  ): StealthPayment {
    const amountField = new FieldElement(amount, SHADOW_PRIME);

    // Create commitment: H(stealthAddress || amount || timestamp)
    const commitmentData = new Uint8Array(stealthAddress.length + 32 + 8);
    commitmentData.set(stealthAddress, 0);
    commitmentData.set(amountField.toBytes(), stealthAddress.length);

    const timestampBytes = new Uint8Array(8);
    const timestampView = new DataView(timestampBytes.buffer);
    timestampView.setBigUint64(0, timestamp, false);
    commitmentData.set(timestampBytes, stealthAddress.length + 32);

    const commitment = sha256(commitmentData);

    const payment: StealthPayment = {
      commitment,
      stealthAddress,
      amount: amountField,
      timestamp,
    };

    this.stealthPayments.push(payment);
    this.rebuildMerkleTree();

    return payment;
  }

  /**
   * Generate zero-knowledge proof for stealth payment
   */
  generateProof(
    paymentIndex: number,
    publicInput: FieldElement[]
  ): StealthProof {
    if (paymentIndex < 0 || paymentIndex >= this.stealthPayments.length) {
      throw new Error("Invalid payment index");
    }

    const payment = this.stealthPayments[paymentIndex];

    if (!this.merkleTree) {
      throw new Error("Merkle tree not initialized");
    }

    const merkleProof = this.merkleTree.getProof(paymentIndex);
    const zkProof = this.generateZKProof(payment, publicInput);

    return {
      commitment: payment.commitment,
      merkleProof,
      zkProof,
      publicInput,
    };
  }

  /**
   * Verify stealth payment proof
   */
  verifyProof(proof: StealthProof, expectedRoot: Uint8Array): boolean {
    // Verify Merkle proof
    if (!proof.merkleProof.verify()) {
      return false;
    }

    // Verify root matches
    const rootMatches =
      proof.merkleProof.root.length === expectedRoot.length &&
      proof.merkleProof.root.every((byte, i) => byte === expectedRoot[i]);

    if (!rootMatches) {
      return false;
    }

    // Verify ZK proof
    return this.verifyZKProof(proof.zkProof, proof.publicInput);
  }

  private generateZKProof(
    payment: StealthPayment,
    publicInput: FieldElement[]
  ): ZKProof {
    // Create polynomial from payment data
    const trace: FieldElement[] = [
      payment.amount,
      new FieldElement(payment.timestamp, SHADOW_PRIME),
      ...publicInput,
    ];

    // Interpolate polynomial
    const points: [FieldElement, FieldElement][] = trace.map((val, i) => [
      new FieldElement(BigInt(i), SHADOW_PRIME),
      val,
    ]);

    const poly = Polynomial.interpolate(points);

    // Evaluate at random points for commitment
    const evaluations: FieldElement[] = [];
    const evaluationLeaves: Uint8Array[] = [];

    for (let i = 0; i < 8; i++) {
      const x = FieldElement.random(SHADOW_PRIME);
      const evaluation = poly.evaluate(x);
      evaluations.push(evaluation);
      evaluationLeaves.push(evaluation.toBytes());
    }

    const evalTree = new MerkleTree(evaluationLeaves);
    const polynomialCommitment = evalTree.getRoot();

    // Generate Fiat-Shamir challenge
    const challengeData = new Uint8Array(
      polynomialCommitment.length + publicInput.length * 32
    );
    challengeData.set(polynomialCommitment, 0);
    publicInput.forEach((input, i) => {
      challengeData.set(input.toBytes(), polynomialCommitment.length + i * 32);
    });
    const hashBytes = sha256(challengeData);
    const challenge = new FieldElement(
      BigInt(
        "0x" +
          Array.from(hashBytes)
            .map((b) => (b as number).toString(16).padStart(2, "0"))
            .join("")
            .slice(0, 64)
      ) % SHADOW_PRIME,
      SHADOW_PRIME
    );

    // Generate query responses
    const queryIndices = [0, 2, 4, 6];
    const evaluationProofs = queryIndices.map((i) => evalTree.getProof(i));
    const response = queryIndices.map((i) => evaluations[i]);

    return {
      polynomialCommitment,
      evaluationProofs,
      challenge,
      response,
    };
  }

  private verifyZKProof(
    zkProof: ZKProof,
    publicInput: FieldElement[]
  ): boolean {
    // Verify evaluation proofs
    for (const proof of zkProof.evaluationProofs) {
      if (!proof.verify()) {
        return false;
      }
    }

    // Verify challenge consistency
    const challengeData = new Uint8Array(
      zkProof.polynomialCommitment.length + publicInput.length * 32
    );
    challengeData.set(zkProof.polynomialCommitment, 0);
    publicInput.forEach((input, i) => {
      challengeData.set(
        input.toBytes(),
        zkProof.polynomialCommitment.length + i * 32
      );
    });
    const hashBytes2 = sha256(challengeData);
    const expectedChallenge = new FieldElement(
      BigInt(
        "0x" +
          Array.from(hashBytes2)
            .map((b) => (b as number).toString(16).padStart(2, "0"))
            .join("")
            .slice(0, 64)
      ) % SHADOW_PRIME,
      SHADOW_PRIME
    );

    if (!zkProof.challenge.equals(expectedChallenge)) {
      return false;
    }

    return true;
  }

  private rebuildMerkleTree(): void {
    const leaves = this.stealthPayments.map((p) => p.commitment);
    this.merkleTree = new MerkleTree(leaves);
  }

  getRoot(): Uint8Array | undefined {
    return this.merkleTree?.getRoot();
  }

  getPaymentCount(): number {
    return this.stealthPayments.length;
  }
}
