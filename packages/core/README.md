# @yfwdecimal/core

Cryptographic engine for AI agent forensic auditing.

## Features

- **SHA-256 Hash Chains** — FIPS 180-4 compliant content + chain hashing
- **Ed25519 Signatures** — RFC 8032 non-repudiation for every record
- **Merkle Trees** — RFC 6962 batch integrity verification
- **Tamper Detection** — Automatic chain break and hash mismatch detection
- **Zero Dependencies** — Uses only Node.js built-in `crypto` module

## Install

```bash
npm install @yfwdecimal/core
```

## Usage

```typescript
import {
  generateKeyPair,
  createTraceRecord,
  verifyChain,
  computeMerkleRoot,
} from '@yfwdecimal/core';

// Generate signing keypair
const keyPair = generateKeyPair();

// Create a signed, hash-chained trace record
const GENESIS = '0'.repeat(64);
const span = {
  spanId: 'span-001',
  traceId: 'trace-001',
  sessionId: 'session-001',
  name: 'GPT-4 Inference',
  kind: 'llm_call',
  startTime: new Date().toISOString(),
  endTime: new Date().toISOString(),
  status: 'completed',
  attributes: {},
  events: [],
  input: { model: 'gpt-4', prompt: '...' },
  output: { tokens: 342 },
};

const record = createTraceRecord(span, GENESIS, 0, keyPair.privateKey, keyPair.publicKey);

// Verify chain integrity
const result = verifyChain([record]);
console.log(result.valid); // true

// Compute Merkle root
const root = computeMerkleRoot([record.chainHash]);
```

## Cryptographic Standards

| Property | Standard |
|----------|----------|
| Content hashing | SHA-256 (FIPS 180-4) |
| Chain linking | SHA-256(content + previous) |
| Digital signatures | Ed25519 (RFC 8032) |
| Batch integrity | Merkle trees (RFC 6962) |

## License

MIT
