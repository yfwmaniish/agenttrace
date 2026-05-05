/**
 * @agenttrace/core — Public API
 *
 * Cryptographic engine for tamper-evident AI agent execution traces.
 * Provides Ed25519 signing, SHA-256 hash chains, and Merkle trees.
 */

// Types
export type {
  KeyPair, Span, SpanKind, SpanStatus, SpanEvent,
  TraceRecord, VerificationResult, VerificationError,
  MerkleNode, MerkleProof, MerkleProofStep,
  AgentTraceConfig, ComplianceExport,
} from './types.js';

// Signing
export { generateKeyPair, signMessage, verifySignature, computeFingerprint } from './signer.js';

// Hash Chain
export { HashChain, sha256, computeContentHash, computeChainHash, createTraceRecord, GENESIS_HASH } from './hash-chain.js';

// Merkle Tree
export { buildMerkleTree, computeMerkleRoot, generateMerkleProof, verifyMerkleProof } from './merkle.js';

// Verification
export { verifyChain, verifyRecordSignature, findTamperPoint } from './verifier.js';

// Serialization
export { canonicalize, canonicalizeSpan } from './serializer.js';
