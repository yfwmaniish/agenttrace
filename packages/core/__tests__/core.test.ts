import { describe, it, expect } from 'vitest';
import {
  generateKeyPair, signMessage, verifySignature, computeFingerprint,
  HashChain, sha256, computeContentHash, computeChainHash, GENESIS_HASH, createTraceRecord,
  buildMerkleTree, computeMerkleRoot, generateMerkleProof, verifyMerkleProof,
  verifyChain, findTamperPoint, verifyRecordSignature,
  canonicalize,
} from '../src/index.js';
import type { Span } from '../src/index.js';

function makeSpan(overrides: Partial<Span> = {}): Span {
  return {
    spanId: 'span-001',
    traceId: 'trace-001',
    sessionId: 'session-001',
    name: 'llm_call',
    kind: 'llm_call',
    startTime: '2026-01-01T00:00:00.000Z',
    endTime: '2026-01-01T00:00:01.000Z',
    status: 'completed',
    attributes: { model: 'gpt-4', temperature: 0.7 },
    events: [],
    input: { prompt: 'Hello' },
    output: { response: 'Hi there' },
    ...overrides,
  };
}

// === SERIALIZER ===
describe('canonicalize', () => {
  it('produces identical output regardless of key order', () => {
    const a = canonicalize({ z: 1, a: 2, m: 3 });
    const b = canonicalize({ a: 2, m: 3, z: 1 });
    expect(a).toBe(b);
  });

  it('handles nested objects', () => {
    const a = canonicalize({ outer: { z: 1, a: 2 } });
    const b = canonicalize({ outer: { a: 2, z: 1 } });
    expect(a).toBe(b);
  });

  it('normalizes undefined to null', () => {
    const result = canonicalize({ a: undefined });
    expect(result).toContain('null');
  });
});

// === SIGNER ===
describe('Ed25519 Signer', () => {
  it('generates valid keypairs', () => {
    const kp = generateKeyPair();
    expect(kp.publicKey).toBeTruthy();
    expect(kp.privateKey).toBeTruthy();
    expect(kp.fingerprint).toHaveLength(16);
    expect(kp.createdAt).toBeTruthy();
  });

  it('signs and verifies messages', () => {
    const kp = generateKeyPair();
    const msg = 'test message for signing';
    const sig = signMessage(msg, kp.privateKey);
    expect(verifySignature(msg, sig, kp.publicKey)).toBe(true);
  });

  it('rejects tampered messages', () => {
    const kp = generateKeyPair();
    const sig = signMessage('original', kp.privateKey);
    expect(verifySignature('tampered', sig, kp.publicKey)).toBe(false);
  });

  it('rejects wrong key', () => {
    const kp1 = generateKeyPair();
    const kp2 = generateKeyPair();
    const sig = signMessage('test', kp1.privateKey);
    expect(verifySignature('test', sig, kp2.publicKey)).toBe(false);
  });

  it('computes consistent fingerprints', () => {
    const kp = generateKeyPair();
    expect(computeFingerprint(kp.publicKey)).toBe(kp.fingerprint);
  });
});

// === HASH CHAIN ===
describe('Hash Chain', () => {
  it('creates valid trace records', () => {
    const kp = generateKeyPair();
    const span = makeSpan();
    const record = createTraceRecord(span, GENESIS_HASH, 0, kp.privateKey, kp.publicKey);

    expect(record.sequenceNumber).toBe(0);
    expect(record.previousHash).toBe(GENESIS_HASH);
    expect(record.contentHash).toBeTruthy();
    expect(record.chainHash).toBeTruthy();
    expect(record.signature).toBeTruthy();
  });

  it('chains records correctly', () => {
    const kp = generateKeyPair();
    const chain = new HashChain(kp.privateKey, kp.publicKey);

    const r1 = chain.append(makeSpan({ spanId: 's1' }));
    const r2 = chain.append(makeSpan({ spanId: 's2' }));

    expect(r1.previousHash).toBe(GENESIS_HASH);
    expect(r2.previousHash).toBe(r1.chainHash);
    expect(chain.length).toBe(2);
  });

  it('content hash changes when span data changes', () => {
    const h1 = computeContentHash(makeSpan({ name: 'call_a' }));
    const h2 = computeContentHash(makeSpan({ name: 'call_b' }));
    expect(h1).not.toBe(h2);
  });

  it('chain hash depends on previous hash', () => {
    const content = sha256('test');
    const c1 = computeChainHash(content, 'aaa');
    const c2 = computeChainHash(content, 'bbb');
    expect(c1).not.toBe(c2);
  });
});

// === MERKLE TREE ===
describe('Merkle Tree', () => {
  it('computes root for single leaf', () => {
    const root = computeMerkleRoot(['abc']);
    expect(root).toBe('abc');
  });

  it('computes consistent root', () => {
    const leaves = ['a', 'b', 'c', 'd'];
    const r1 = computeMerkleRoot(leaves);
    const r2 = computeMerkleRoot(leaves);
    expect(r1).toBe(r2);
  });

  it('builds tree and matches root', () => {
    const leaves = ['a', 'b', 'c', 'd'];
    const tree = buildMerkleTree(leaves);
    const root = computeMerkleRoot(leaves);
    expect(tree.hash).toBe(root);
  });

  it('generates and verifies inclusion proofs', () => {
    const leaves = [sha256('a'), sha256('b'), sha256('c'), sha256('d')];
    for (let i = 0; i < leaves.length; i++) {
      const proof = generateMerkleProof(leaves, i);
      expect(verifyMerkleProof(proof)).toBe(true);
    }
  });

  it('rejects invalid proofs', () => {
    const leaves = [sha256('a'), sha256('b'), sha256('c'), sha256('d')];
    const proof = generateMerkleProof(leaves, 0);
    proof.leaf = sha256('tampered');
    expect(verifyMerkleProof(proof)).toBe(false);
  });

  it('handles odd number of leaves', () => {
    const leaves = [sha256('a'), sha256('b'), sha256('c')];
    const proof = generateMerkleProof(leaves, 2);
    expect(verifyMerkleProof(proof)).toBe(true);
  });
});

// === VERIFIER ===
describe('Chain Verification', () => {
  it('verifies a valid chain', () => {
    const kp = generateKeyPair();
    const chain = new HashChain(kp.privateKey, kp.publicKey);
    chain.append(makeSpan({ spanId: 's1' }));
    chain.append(makeSpan({ spanId: 's2' }));
    chain.append(makeSpan({ spanId: 's3' }));

    const result = verifyChain([...chain.getRecords()]);
    expect(result.valid).toBe(true);
    expect(result.chainLength).toBe(3);
    expect(result.errors).toHaveLength(0);
  });

  it('detects content tampering', () => {
    const kp = generateKeyPair();
    const chain = new HashChain(kp.privateKey, kp.publicKey);
    chain.append(makeSpan({ spanId: 's1' }));
    chain.append(makeSpan({ spanId: 's2' }));

    const records = [...chain.getRecords()];
    // Tamper with the span data
    (records[1] as any).span.output = { response: 'TAMPERED DATA' };

    const result = verifyChain(records);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0].type).toBe('hash_mismatch');
  });

  it('detects chain break (deleted record)', () => {
    const kp = generateKeyPair();
    const chain = new HashChain(kp.privateKey, kp.publicKey);
    chain.append(makeSpan({ spanId: 's1' }));
    chain.append(makeSpan({ spanId: 's2' }));
    chain.append(makeSpan({ spanId: 's3' }));

    // Remove middle record
    const records = [...chain.getRecords()];
    records.splice(1, 1);

    const result = verifyChain(records);
    expect(result.valid).toBe(false);
  });

  it('findTamperPoint returns null for valid chain', () => {
    const kp = generateKeyPair();
    const chain = new HashChain(kp.privateKey, kp.publicKey);
    chain.append(makeSpan({ spanId: 's1' }));
    expect(findTamperPoint([...chain.getRecords()])).toBeNull();
  });

  it('findTamperPoint locates tampered record', () => {
    const kp = generateKeyPair();
    const chain = new HashChain(kp.privateKey, kp.publicKey);
    chain.append(makeSpan({ spanId: 's1' }));
    chain.append(makeSpan({ spanId: 's2' }));

    const records = [...chain.getRecords()];
    (records[1] as any).span.name = 'HACKED';

    const tamper = findTamperPoint(records);
    expect(tamper).not.toBeNull();
    expect(tamper!.index).toBe(1);
  });

  it('verifyRecordSignature works standalone', () => {
    const kp = generateKeyPair();
    const chain = new HashChain(kp.privateKey, kp.publicKey);
    const record = chain.append(makeSpan());
    expect(verifyRecordSignature(record)).toBe(true);
  });
});
