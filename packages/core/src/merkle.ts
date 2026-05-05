/**
 * Merkle Tree
 *
 * Provides batch verification and inclusion proofs for trace records.
 * The Merkle root serves as a compact summary of all records — useful for:
 * 1. Anchoring to external systems (Git commits, timestamping authorities)
 * 2. Proving a specific record exists in the batch without revealing all records
 * 3. Efficient verification of large datasets
 */

import { createHash } from 'crypto';
import type { MerkleNode, MerkleProof, MerkleProofStep } from './types.js';

/**
 * Compute SHA-256 of two concatenated hashes (internal node computation).
 */
function hashPair(left: string, right: string): string {
  return createHash('sha256')
    .update(left + right, 'utf-8')
    .digest('hex');
}

/**
 * Build a Merkle tree from an array of leaf hashes (typically chainHashes).
 * Returns the root node with the full tree structure.
 *
 * If the number of leaves is odd, the last leaf is duplicated.
 */
export function buildMerkleTree(leaves: string[]): MerkleNode {
  if (leaves.length === 0) {
    return { hash: '0'.repeat(64) };
  }

  if (leaves.length === 1) {
    return { hash: leaves[0], data: leaves[0] };
  }

  // Create leaf nodes
  let level: MerkleNode[] = leaves.map((hash) => ({
    hash,
    data: hash,
  }));

  // Build tree bottom-up
  while (level.length > 1) {
    const nextLevel: MerkleNode[] = [];

    for (let i = 0; i < level.length; i += 2) {
      const left = level[i];
      // If odd number, duplicate the last node
      const right = i + 1 < level.length ? level[i + 1] : level[i];

      nextLevel.push({
        hash: hashPair(left.hash, right.hash),
        left,
        right,
      });
    }

    level = nextLevel;
  }

  return level[0];
}

/**
 * Compute just the Merkle root hash without building the full tree.
 * More memory-efficient for large datasets.
 */
export function computeMerkleRoot(leaves: string[]): string {
  if (leaves.length === 0) return '0'.repeat(64);
  if (leaves.length === 1) return leaves[0];

  let level = [...leaves];

  while (level.length > 1) {
    const nextLevel: string[] = [];

    for (let i = 0; i < level.length; i += 2) {
      const left = level[i];
      const right = i + 1 < level.length ? level[i + 1] : level[i];
      nextLevel.push(hashPair(left, right));
    }

    level = nextLevel;
  }

  return level[0];
}

/**
 * Generate a Merkle inclusion proof for a specific leaf.
 * The proof allows anyone to verify that the leaf is part of the tree
 * by recomputing the root hash from the leaf + proof siblings.
 */
export function generateMerkleProof(
  leaves: string[],
  targetIndex: number,
): MerkleProof {
  if (targetIndex < 0 || targetIndex >= leaves.length) {
    throw new Error(`Index ${targetIndex} out of range [0, ${leaves.length})`);
  }

  const proof: MerkleProofStep[] = [];
  let level = [...leaves];
  let index = targetIndex;

  while (level.length > 1) {
    const nextLevel: string[] = [];

    for (let i = 0; i < level.length; i += 2) {
      const left = level[i];
      const right = i + 1 < level.length ? level[i + 1] : level[i];

      // If current index is in this pair, add sibling to proof
      if (i === index || i + 1 === index) {
        if (index % 2 === 0) {
          // We're the left child, sibling is on the right
          proof.push({
            hash: right,
            position: 'right',
          });
        } else {
          // We're the right child, sibling is on the left
          proof.push({
            hash: left,
            position: 'left',
          });
        }
      }

      nextLevel.push(hashPair(left, right));
    }

    level = nextLevel;
    index = Math.floor(index / 2);
  }

  return {
    leaf: leaves[targetIndex],
    root: level[0],
    proof,
    index: targetIndex,
    treeSize: leaves.length,
  };
}

/**
 * Verify a Merkle inclusion proof.
 * Recomputes the root from the leaf + proof and checks against the expected root.
 */
export function verifyMerkleProof(proof: MerkleProof): boolean {
  let hash = proof.leaf;

  for (const step of proof.proof) {
    if (step.position === 'left') {
      hash = hashPair(step.hash, hash);
    } else {
      hash = hashPair(hash, step.hash);
    }
  }

  return hash === proof.root;
}
