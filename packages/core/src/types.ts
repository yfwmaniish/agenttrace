/**
 * @yfwdecimal/core — Core type definitions
 *
 * These types define the data model for tamper-evident execution traces.
 * Every type is designed for deterministic serialization and cryptographic signing.
 */

/** Ed25519 keypair for trace signing */
export interface KeyPair {
  publicKey: string;   // hex-encoded Ed25519 public key
  privateKey: string;  // hex-encoded Ed25519 private key
  fingerprint: string; // SHA-256 hash of publicKey (first 16 hex chars)
  createdAt: string;   // ISO 8601 UTC
}

/** A single span within a trace — represents one agent action */
export interface Span {
  spanId: string;        // UUIDv4
  traceId: string;       // UUIDv4 — groups spans in one execution
  parentSpanId?: string; // For nested spans (e.g., tool call inside agent step)
  sessionId: string;     // Groups traces in one session
  name: string;          // e.g., "llm_call", "tool_invoke", "agent_step"
  kind: SpanKind;
  startTime: string;     // ISO 8601 UTC
  endTime?: string;      // ISO 8601 UTC
  status: SpanStatus;
  attributes: Record<string, unknown>; // Arbitrary metadata
  events: SpanEvent[];   // Discrete events within the span
  input?: unknown;       // What the agent received
  output?: unknown;      // What the agent produced
}

export type SpanKind =
  | 'agent_step'
  | 'llm_call'
  | 'tool_invoke'
  | 'chain_run'
  | 'retrieval'
  | 'embedding'
  | 'custom';

export type SpanStatus = 'running' | 'completed' | 'error';

export interface SpanEvent {
  name: string;
  timestamp: string; // ISO 8601 UTC
  attributes?: Record<string, unknown>;
}

/** A signed, hash-chained record — the atomic unit of the audit trail */
export interface TraceRecord {
  id: string;           // UUIDv4
  sequenceNumber: number; // Monotonically increasing within a chain
  span: Span;
  contentHash: string;  // SHA-256 of canonical(span)
  previousHash: string; // Hash of the previous record (genesis = "0".repeat(64))
  chainHash: string;    // SHA-256(contentHash + previousHash)
  signature: string;    // Ed25519 signature of chainHash
  publicKey: string;    // Signing key (hex)
  timestamp: string;    // ISO 8601 UTC — when this record was created
}

/** Result of chain verification */
export interface VerificationResult {
  valid: boolean;
  chainLength: number;
  firstRecord: string;  // id
  lastRecord: string;   // id
  errors: VerificationError[];
  verifiedAt: string;   // ISO 8601 UTC
  merkleRoot?: string;  // If Merkle tree was computed
}

export interface VerificationError {
  recordId: string;
  sequenceNumber: number;
  type: 'hash_mismatch' | 'signature_invalid' | 'chain_break' | 'sequence_gap';
  expected: string;
  actual: string;
  message: string;
}

/** Merkle tree node */
export interface MerkleNode {
  hash: string;
  left?: MerkleNode;
  right?: MerkleNode;
  data?: string; // Leaf nodes store the record's chainHash
}

/** Merkle inclusion proof */
export interface MerkleProof {
  leaf: string;
  root: string;
  proof: MerkleProofStep[];
  index: number;
  treeSize: number;
}

export interface MerkleProofStep {
  hash: string;
  position: 'left' | 'right';
}

/** Configuration for AgentTrace */
export interface AgentTraceConfig {
  projectName: string;
  apiEndpoint?: string;
  apiKey?: string;
  keyPair?: KeyPair;
  autoSign?: boolean;     // Default: true
  batchSize?: number;     // Records before Merkle root computation. Default: 100
  localStorePath?: string; // SQLite fallback path
}

/** ISO 42001 compliance export */
export interface ComplianceExport {
  standard: 'ISO_42001' | 'ISO_27001' | 'SOC2';
  generatedAt: string;
  sessionId: string;
  chainIntegrity: VerificationResult;
  merkleRoot: string;
  signingKeyFingerprint: string;
  traceCount: number;
  timeRange: {
    start: string;
    end: string;
  };
  records: TraceRecord[];
  metadata: Record<string, unknown>;
}
