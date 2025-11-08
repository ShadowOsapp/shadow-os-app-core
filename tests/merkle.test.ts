import { describe, test, expect } from "bun:test";
import { MerkleTree, MerkleProof } from "../src/core/merkle";
import { sha256 } from "@noble/hashes/sha256";

describe("MerkleTree", () => {
  test("should create merkle tree from leaves", () => {
    const leaves = [
      new Uint8Array([1, 2, 3]),
      new Uint8Array([4, 5, 6]),
      new Uint8Array([7, 8, 9]),
      new Uint8Array([10, 11, 12]),
    ];
    const tree = new MerkleTree(leaves);
    expect(tree.getRoot()).toBeDefined();
  });

  test("should generate valid inclusion proof", () => {
    const leaves = [
      new Uint8Array([1, 2, 3]),
      new Uint8Array([4, 5, 6]),
      new Uint8Array([7, 8, 9]),
      new Uint8Array([10, 11, 12]),
    ];
    const tree = new MerkleTree(leaves);
    const proof = tree.getProof(1);

    expect(proof.leaf).toBeDefined();
    expect(proof.siblings).toBeDefined();
    expect(proof.index).toBe(1);
    expect(proof.root).toBeDefined();
  });

  test("should verify valid inclusion proof", () => {
    const leaves = [
      new Uint8Array([1, 2, 3]),
      new Uint8Array([4, 5, 6]),
      new Uint8Array([7, 8, 9]),
      new Uint8Array([10, 11, 12]),
    ];
    const tree = new MerkleTree(leaves);
    const proof = tree.getProof(1);
    expect(proof.verify()).toBe(true);
  });

  test("should reject invalid inclusion proof", () => {
    const leaves = [
      new Uint8Array([1, 2, 3]),
      new Uint8Array([4, 5, 6]),
      new Uint8Array([7, 8, 9]),
      new Uint8Array([10, 11, 12]),
    ];
    const tree = new MerkleTree(leaves);
    const proof = tree.getProof(1);

    // Create a new MerkleProof with tampered leaf
    const tamperedProof = new MerkleProof(
      new Uint8Array([99, 99, 99]), // tampered leaf
      proof.siblings,
      proof.index,
      proof.root
    );
    expect(tamperedProof.verify()).toBe(false);
  });

  test("should handle single leaf", () => {
    const leaves = [new Uint8Array([1, 2, 3])];
    const tree = new MerkleTree(leaves);
    const root = tree.getRoot();
    expect(root).toBeDefined();

    // For single leaf, root should be hash of the leaf
    const expectedRoot = sha256(leaves[0]);
    expect(root).toEqual(expectedRoot);
  });

  test("should handle empty tree", () => {
    const tree = new MerkleTree([]);
    const root = tree.getRoot();
    expect(root).toBeUndefined();
  });

  test("should handle odd number of leaves", () => {
    const leaves = [
      new Uint8Array([1]),
      new Uint8Array([2]),
      new Uint8Array([3]),
    ];
    const tree = new MerkleTree(leaves);
    const root = tree.getRoot();
    expect(root).toBeDefined();

    // All proofs should be valid
    for (let i = 0; i < leaves.length; i++) {
      const proof = tree.getProof(i);
      expect(proof.verify()).toBe(true);
    }
  });
});
