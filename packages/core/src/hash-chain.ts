/**
 * SHA-256 Hash Chain
 *
 * Each record's hash depends on the previous record's hash, creating
 * an unbreakable chain. If any record is tampered with, all subsequent
 * hashes become invalid — making tampering detectable.
 *
 * Chain structure:
 *   Record 0: chainHash = SHA-256(contentHash + GENESIS_HASH)
 *   Record 1: chainHash = SHA-256(contentHash + record0.chainHash)
 *   Record N: chainHash = SHA-256(contentHash + record(N-1).chainHash)
 */

import { createHash, randomUUID } from 'crypto';
import type { Span, TraceRecord } from './types.js';
import { canonicalizeSpan } from './serializer.js';
import { signMessage } from './signer.js';

/** Genesis hash — the "previous hash" for the first record in a chain */
export const GENESIS_HASH = '0'.repeat(64);

/**
 * Compute SHA-256 hash of arbitrary data.
 */
export function sha256(data: string): string {
  return createHash('sha256').update(data, 'utf-8').digest('hex');
}

/**
 * Compute the content hash of a span.
 * This captures the span's identity independent of chain position.
 */
export function computeContentHash(span: Span): string {
  return sha256(canonicalizeSpan(span));
}

/**
 * Compute the chain hash linking this record to the previous one.
 * chainHash = SHA-256(contentHash + previousHash)
 */
export function computeChainHash(contentHash: string, previousHash: string): string {
  return sha256(contentHash + previousHash);
}

/**
 * Create a signed, hash-chained TraceRecord from a Span.
 *
 * @param span - The span to record
 * @param previousHash - The chainHash of the previous record (GENESIS_HASH for first)
 * @param sequenceNumber - Monotonically increasing sequence number
 * @param privateKeyHex - Ed25519 private key for signing
 * @param publicKeyHex - Corresponding public key
 */
export function createTraceRecord(
  span: Span,
  previousHash: string,
  sequenceNumber: number,
  privateKeyHex: string,
  publicKeyHex: string,
): TraceRecord {
  const contentHash = computeContentHash(span);
  const chainHash = computeChainHash(contentHash, previousHash);
  const signature = signMessage(chainHash, privateKeyHex);

  return {
    id: randomUUID(),
    sequenceNumber,
    span,
    contentHash,
    previousHash,
    chainHash,
    signature,
    publicKey: publicKeyHex,
    timestamp: new Date().toISOString(),
  };
}

/**
 * HashChain — manages an append-only sequence of signed records.
 *
 * Usage:
 *   const chain = new HashChain(keyPair);
 *   chain.append(span1);
 *   chain.append(span2);
 *   const result = chain.verify();
 */
export class HashChain {
  private records: TraceRecord[] = [];
  private lastHash: string = GENESIS_HASH;
  private sequence: number = 0;

  constructor(
    private readonly privateKey: string,
    private readonly publicKey: string,
  ) {}

  /** Append a span to the chain, returning the signed record */
  append(span: Span): TraceRecord {
    const record = createTraceRecord(
      span,
      this.lastHash,
      this.sequence,
      this.privateKey,
      this.publicKey,
    );
    this.records.push(record);
    this.lastHash = record.chainHash;
    this.sequence++;
    return record;
  }

  /** Get all records in the chain */
  getRecords(): readonly TraceRecord[] {
    return this.records;
  }

  /** Get the current chain tip hash */
  getTipHash(): string {
    return this.lastHash;
  }

  /** Get the chain length */
  get length(): number {
    return this.records.length;
  }

  /** Load existing records (e.g., from database) to continue a chain */
  loadRecords(records: TraceRecord[]): void {
    if (records.length === 0) return;

    const sorted = [...records].sort((a, b) => a.sequenceNumber - b.sequenceNumber);
    this.records = sorted;
    this.lastHash = sorted[sorted.length - 1].chainHash;
    this.sequence = sorted[sorted.length - 1].sequenceNumber + 1;
  }
}
