/**
 * Merkle Tree
 * 
 * Cryptographic commitment scheme for zero-knowledge proofs
 */

import { sha256 } from '@noble/hashes/sha256';
import { FieldElement } from './field';

export class MerkleTree {
  private tree: Uint8Array[][];
  private leaves: Uint8Array[];

  constructor(leaves: Uint8Array[]) {
    this.leaves = leaves.map(leaf => new Uint8Array(leaf));
    this.tree = [this.leaves];
    this.buildTree();
  }

  private hash(data: Uint8Array): Uint8Array {
    return sha256(data);
  }

  private buildTree(): void {
    let currentLevel = this.leaves;

    while (currentLevel.length > 1) {
      const nextLevel: Uint8Array[] = [];

      for (let i = 0; i < currentLevel.length; i += 2) {
        const left = currentLevel[i];
        const right = i + 1 < currentLevel.length 
          ? currentLevel[i + 1] 
          : currentLevel[i]; // Duplicate last element if odd

        const combined = new Uint8Array(left.length + right.length);
        combined.set(left, 0);
        combined.set(right, left.length);
        nextLevel.push(this.hash(combined));
      }

      this.tree.push(nextLevel);
      currentLevel = nextLevel;
    }
  }

  getRoot(): Uint8Array | undefined {
    if (this.tree.length === 0 || this.tree[this.tree.length - 1].length === 0) {
      return undefined;
    }
    return this.tree[this.tree.length - 1][0];
  }

  getProof(index: number): MerkleProof {
    if (index < 0 || index >= this.leaves.length) {
      throw new Error("Invalid leaf index");
    }

    const proof: Uint8Array[] = [];
    let currentIndex = index;

    for (let level = 0; level < this.tree.length - 1; level++) {
      const levelNodes = this.tree[level];
      const siblingIndex = currentIndex % 2 === 0 
        ? currentIndex + 1 
        : currentIndex - 1;

      if (siblingIndex < levelNodes.length) {
        proof.push(levelNodes[siblingIndex]);
      } else {
        // If no sibling, use the node itself (for odd-length levels)
        proof.push(levelNodes[currentIndex]);
      }

      currentIndex = Math.floor(currentIndex / 2);
    }

    return new MerkleProof(
      this.leaves[index],
      proof,
      index,
      this.getRoot()
    );
  }

  getLeaf(index: number): Uint8Array {
    return this.leaves[index];
  }
}

export class MerkleProof {
  constructor(
    public readonly leaf: Uint8Array,
    public readonly siblings: Uint8Array[],
    public readonly index: number,
    public readonly root: Uint8Array
  ) {}

  verify(): boolean {
    let currentHash = this.leaf;
    let currentIndex = this.index;

    for (const sibling of this.siblings) {
      const combined = new Uint8Array(currentHash.length + sibling.length);
      
      if (currentIndex % 2 === 0) {
        combined.set(currentHash, 0);
        combined.set(sibling, currentHash.length);
      } else {
        combined.set(sibling, 0);
        combined.set(currentHash, sibling.length);
      }

      currentHash = sha256(combined);
      currentIndex = Math.floor(currentIndex / 2);
    }

    // Compare with root
    if (currentHash.length !== this.root.length) {
      return false;
    }
    for (let i = 0; i < currentHash.length; i++) {
      if (currentHash[i] !== this.root[i]) {
        return false;
      }
    }
    return true;
  }
}


