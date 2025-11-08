import { describe, test, expect } from "bun:test";
import { AIReputationEngine } from "../src/identity/reputation";
import { ReputationError } from "../src/core/errors";

describe("AIReputationEngine", () => {
  test("should create identity shadow", () => {
    const engine = new AIReputationEngine();
    const identity = engine.createIdentityShadow();

    expect(identity.pseudonym).toBeDefined();
    expect(identity.pseudonym.length).toBe(32);
    expect(identity.reputationScore).toBe(0);
    expect(identity.onChainInteractions).toBe(0);
    expect(identity.verifiedAttributes).toEqual([]);
  });

  test("should create identity shadow with seed", () => {
    const engine = new AIReputationEngine();
    const seed = new Uint8Array(32);
    seed.fill(42);
    const identity = engine.createIdentityShadow(seed);

    expect(identity.pseudonym).toBeDefined();
    // Same seed should produce same pseudonym
    const identity2 = engine.createIdentityShadow(seed);
    expect(identity.pseudonym).toEqual(identity2.pseudonym);
  });

  test("should update reputation for payment", () => {
    const engine = new AIReputationEngine();
    const identity = engine.createIdentityShadow();

    engine.updateReputation(identity.pseudonym, "payment", 1.0);
    const updated = engine.getIdentity(identity.pseudonym);

    expect(updated?.reputationScore).toBe(1);
    expect(updated?.onChainInteractions).toBe(1);
  });

  test("should update reputation for verification", () => {
    const engine = new AIReputationEngine();
    const identity = engine.createIdentityShadow();

    engine.updateReputation(identity.pseudonym, "verification", 1.0);
    const updated = engine.getIdentity(identity.pseudonym);

    expect(updated?.reputationScore).toBe(2);
  });

  test("should update reputation for compliance", () => {
    const engine = new AIReputationEngine();
    const identity = engine.createIdentityShadow();

    engine.updateReputation(identity.pseudonym, "compliance", 1.0);
    const updated = engine.getIdentity(identity.pseudonym);

    expect(updated?.reputationScore).toBe(3);
  });

  test("should decrease reputation for violation", () => {
    const engine = new AIReputationEngine();
    const identity = engine.createIdentityShadow();

    // First add some reputation
    engine.updateReputation(identity.pseudonym, "payment", 1.0);
    engine.updateReputation(identity.pseudonym, "payment", 1.0);
    engine.updateReputation(identity.pseudonym, "payment", 1.0);

    // Then violate
    engine.updateReputation(identity.pseudonym, "violation", 1.0);
    const updated = engine.getIdentity(identity.pseudonym);

    expect(updated?.reputationScore).toBe(0); // Max(0, 3 - 10)
  });

  test("should normalize reputation score to 0-100", () => {
    const engine = new AIReputationEngine();
    const identity = engine.createIdentityShadow();

    // Add lots of reputation
    for (let i = 0; i < 200; i++) {
      engine.updateReputation(identity.pseudonym, "payment", 1.0);
    }

    const updated = engine.getIdentity(identity.pseudonym);
    expect(updated?.reputationScore).toBeLessThanOrEqual(100);
  });

  test("should add verified attribute", () => {
    const engine = new AIReputationEngine();
    const identity = engine.createIdentityShadow();
    const zkProof = new Uint8Array(32);
    zkProof.fill(123);

    engine.addVerifiedAttribute(identity.pseudonym, "kyc", zkProof);
    const updated = engine.getIdentity(identity.pseudonym);

    expect(updated?.verifiedAttributes.length).toBe(1);
    expect(updated?.verifiedAttributes[0].attributeType).toBe("kyc");
    expect(updated?.verifiedAttributes[0].zkProof).toEqual(zkProof);
    // Should also boost reputation
    expect(updated?.reputationScore).toBeGreaterThan(0);
  });

  test("should generate reputation proof", () => {
    const engine = new AIReputationEngine();
    const identity = engine.createIdentityShadow();

    engine.updateReputation(identity.pseudonym, "payment", 1.0);
    engine.updateReputation(identity.pseudonym, "verification", 1.0);

    const proof = engine.generateReputationProof(identity.pseudonym, 1.0);

    expect(proof.pseudonym).toEqual(identity.pseudonym);
    expect(proof.reputationScore).toBeGreaterThanOrEqual(1.0);
    expect(proof.zkProof).toBeDefined();
    expect(proof.publicCommitment).toBeDefined();
  });

  test("should verify reputation proof", () => {
    const engine = new AIReputationEngine();
    const identity = engine.createIdentityShadow();

    engine.updateReputation(identity.pseudonym, "payment", 1.0);
    engine.updateReputation(identity.pseudonym, "verification", 1.0);

    const proof = engine.generateReputationProof(identity.pseudonym, 1.0);
    const isValid = engine.verifyReputationProof(proof, 1.0);

    expect(isValid).toBe(true);
  });

  test("should reject proof with score below minimum", () => {
    const engine = new AIReputationEngine();
    const identity = engine.createIdentityShadow();

    engine.updateReputation(identity.pseudonym, "payment", 1.0);

    const proof = engine.generateReputationProof(identity.pseudonym);
    const isValid = engine.verifyReputationProof(proof, 10.0);

    expect(isValid).toBe(false);
  });

  test("should throw error when generating proof for non-existent identity", () => {
    const engine = new AIReputationEngine();
    const fakePseudonym = new Uint8Array(32);
    fakePseudonym.fill(99);

    expect(() => {
      engine.generateReputationProof(fakePseudonym);
    }).toThrow();
  });

  test("should throw error when updating reputation for non-existent identity", () => {
    const engine = new AIReputationEngine();
    const fakePseudonym = new Uint8Array(32);
    fakePseudonym.fill(99);

    expect(() => {
      engine.updateReputation(fakePseudonym, "payment", 1.0);
    }).toThrow();
  });

  test("should throw error when proof score below minimum threshold", () => {
    const engine = new AIReputationEngine();
    const identity = engine.createIdentityShadow();

    engine.updateReputation(identity.pseudonym, "payment", 1.0);

    expect(() => {
      engine.generateReputationProof(identity.pseudonym, 10.0);
    }).toThrow();
  });

  test("should get identity by pseudonym", () => {
    const engine = new AIReputationEngine();
    const identity = engine.createIdentityShadow();

    const retrieved = engine.getIdentity(identity.pseudonym);

    expect(retrieved).toBeDefined();
    expect(retrieved?.pseudonym).toEqual(identity.pseudonym);
  });

  test("should return undefined for non-existent identity", () => {
    const engine = new AIReputationEngine();
    const fakePseudonym = new Uint8Array(32);
    fakePseudonym.fill(99);

    const retrieved = engine.getIdentity(fakePseudonym);

    expect(retrieved).toBeUndefined();
  });
});

