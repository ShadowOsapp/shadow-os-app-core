import { describe, test, expect } from "bun:test";
import { X402StealthPayment } from "../src/zk/x402";
import { FieldElement, SHADOW_PRIME } from "../src/core/field";
import { ValidationError, ProofError } from "../src/core/errors";

describe("X402StealthPayment", () => {
  test("should create stealth payment", () => {
    const stealthPayment = new X402StealthPayment();
    const stealthAddress = new Uint8Array(32);
    crypto.getRandomValues(stealthAddress);
    const amount = 1000000n;

    const payment = stealthPayment.createPayment(stealthAddress, amount);

    expect(payment.commitment).toBeDefined();
    expect(payment.stealthAddress).toEqual(stealthAddress);
    expect(payment.amount.value).toBe(amount);
    expect(payment.timestamp).toBeDefined();
  });

  test("should generate and verify proof", () => {
    const stealthPayment = new X402StealthPayment();
    const stealthAddress = new Uint8Array(32);
    crypto.getRandomValues(stealthAddress);
    const amount = 1000000n;

    const payment = stealthPayment.createPayment(stealthAddress, amount);
    const publicInput: FieldElement[] = [
      new FieldElement(amount, SHADOW_PRIME),
      new FieldElement(payment.timestamp, SHADOW_PRIME),
    ];

    const proof = stealthPayment.generateProof(0, publicInput);
    const root = stealthPayment.getRoot();

    expect(proof).toBeDefined();
    expect(root).toBeDefined();
    expect(stealthPayment.verifyProof(proof, root!)).toBe(true);
  });

  test("should reject invalid proof", () => {
    const stealthPayment = new X402StealthPayment();
    const stealthAddress = new Uint8Array(32);
    crypto.getRandomValues(stealthAddress);
    const amount = 1000000n;

    stealthPayment.createPayment(stealthAddress, amount);
    const publicInput: FieldElement[] = [
      new FieldElement(amount, SHADOW_PRIME),
      new FieldElement(BigInt(Date.now()), SHADOW_PRIME),
    ];

    const proof = stealthPayment.generateProof(0, publicInput);
    const root = stealthPayment.getRoot();

    // Tamper with proof
    proof.commitment = new Uint8Array(32);
    expect(stealthPayment.verifyProof(proof, root!)).toBe(false);
  });

  test("should create batch payments", () => {
    const stealthPayment = new X402StealthPayment();
    const payments = Array.from({ length: 5 }, () => ({
      stealthAddress: new Uint8Array(32),
      amount: 1000000n,
    }));
    payments.forEach((p) => crypto.getRandomValues(p.stealthAddress));

    const createdPayments = stealthPayment.createBatchPayments(payments);

    expect(createdPayments.length).toBe(5);
    expect(stealthPayment.getPaymentCount()).toBe(5);
    expect(stealthPayment.getRoot()).toBeDefined();
  });

  test("should throw error for invalid stealth address", () => {
    const stealthPayment = new X402StealthPayment();
    const invalidAddress = new Uint8Array(31); // Wrong size

    expect(() => {
      stealthPayment.createPayment(invalidAddress, 1000000n);
    }).toThrow(ValidationError);
  });

  test("should throw error for invalid amount", () => {
    const stealthPayment = new X402StealthPayment();
    const stealthAddress = new Uint8Array(32);
    crypto.getRandomValues(stealthAddress);

    expect(() => {
      stealthPayment.createPayment(stealthAddress, 0n);
    }).toThrow(ValidationError);
  });

  test("should throw error for invalid payment index", () => {
    const stealthPayment = new X402StealthPayment();
    const stealthAddress = new Uint8Array(32);
    crypto.getRandomValues(stealthAddress);

    stealthPayment.createPayment(stealthAddress, 1000000n);

    expect(() => {
      stealthPayment.generateProof(10, []);
    }).toThrow(ProofError);
  });

  test("should get payment by index", () => {
    const stealthPayment = new X402StealthPayment();
    const stealthAddress = new Uint8Array(32);
    crypto.getRandomValues(stealthAddress);

    const payment = stealthPayment.createPayment(stealthAddress, 1000000n);
    const retrieved = stealthPayment.getPayment(0);

    expect(retrieved).toBeDefined();
    expect(retrieved?.commitment).toEqual(payment.commitment);
  });

  test("should return undefined for invalid index", () => {
    const stealthPayment = new X402StealthPayment();
    expect(stealthPayment.getPayment(0)).toBeUndefined();
    expect(stealthPayment.getPayment(-1)).toBeUndefined();
  });
});

