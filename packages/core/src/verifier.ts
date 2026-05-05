/**
 * Chain & Signature Verification
 */
import type { TraceRecord, VerificationResult, VerificationError } from './types.js';
import { computeContentHash, computeChainHash, GENESIS_HASH } from './hash-chain.js';
import { verifySignature } from './signer.js';

export function verifyChain(records: TraceRecord[]): VerificationResult {
  const errors: VerificationError[] = [];
  const sorted = [...records].sort((a, b) => a.sequenceNumber - b.sequenceNumber);

  if (sorted.length === 0) {
    return { valid: true, chainLength: 0, firstRecord: '', lastRecord: '', errors: [], verifiedAt: new Date().toISOString() };
  }

  for (let i = 0; i < sorted.length; i++) {
    const record = sorted[i];
    const expectedPrevHash = i === 0 ? GENESIS_HASH : sorted[i - 1].chainHash;

    if (record.sequenceNumber !== i) {
      errors.push({ recordId: record.id, sequenceNumber: record.sequenceNumber, type: 'sequence_gap', expected: String(i), actual: String(record.sequenceNumber), message: `Expected sequence ${i}, got ${record.sequenceNumber}` });
    }
    if (record.previousHash !== expectedPrevHash) {
      errors.push({ recordId: record.id, sequenceNumber: record.sequenceNumber, type: 'chain_break', expected: expectedPrevHash, actual: record.previousHash, message: `Chain break at sequence ${record.sequenceNumber}` });
    }
    const reContentHash = computeContentHash(record.span);
    if (record.contentHash !== reContentHash) {
      errors.push({ recordId: record.id, sequenceNumber: record.sequenceNumber, type: 'hash_mismatch', expected: reContentHash, actual: record.contentHash, message: `Content tampered at sequence ${record.sequenceNumber}` });
    }
    const reChainHash = computeChainHash(record.contentHash, record.previousHash);
    if (record.chainHash !== reChainHash) {
      errors.push({ recordId: record.id, sequenceNumber: record.sequenceNumber, type: 'hash_mismatch', expected: reChainHash, actual: record.chainHash, message: `Chain hash mismatch at sequence ${record.sequenceNumber}` });
    }
    if (!verifySignature(record.chainHash, record.signature, record.publicKey)) {
      errors.push({ recordId: record.id, sequenceNumber: record.sequenceNumber, type: 'signature_invalid', expected: 'valid', actual: 'invalid', message: `Invalid signature at sequence ${record.sequenceNumber}` });
    }
  }

  return { valid: errors.length === 0, chainLength: sorted.length, firstRecord: sorted[0].id, lastRecord: sorted[sorted.length - 1].id, errors, verifiedAt: new Date().toISOString() };
}

export function verifyRecordSignature(record: TraceRecord): boolean {
  return verifySignature(record.chainHash, record.signature, record.publicKey);
}

export function findTamperPoint(records: TraceRecord[]): { index: number; record: TraceRecord; error: VerificationError } | null {
  const result = verifyChain(records);
  if (result.valid) return null;
  const sorted = [...records].sort((a, b) => a.sequenceNumber - b.sequenceNumber);
  const idx = sorted.findIndex((r) => r.id === result.errors[0].recordId);
  return { index: idx, record: sorted[idx], error: result.errors[0] };
}
