/**
 * Ed25519 Digital Signatures
 *
 * Uses Node.js native crypto for Ed25519 key generation, signing, and verification.
 * Ed25519 was chosen over RSA/ECDSA for:
 * - Deterministic signatures (same input → same signature)
 * - Fast verification (important for chain verification)
 * - Small key/signature sizes (32-byte keys, 64-byte signatures)
 * - Resistance to side-channel attacks
 */

import { createHash, generateKeyPairSync, sign, verify, KeyObject, createPrivateKey, createPublicKey } from 'crypto';
import type { KeyPair } from './types.js';

const GENESIS_TIMESTAMP = '2026-01-01T00:00:00.000Z';

/**
 * Generate a new Ed25519 keypair for trace signing.
 */
export function generateKeyPair(): KeyPair {
  const { publicKey, privateKey } = generateKeyPairSync('ed25519');

  const pubHex = publicKey
    .export({ type: 'spki', format: 'der' })
    .toString('hex');
  const privHex = privateKey
    .export({ type: 'pkcs8', format: 'der' })
    .toString('hex');

  const fingerprint = createHash('sha256')
    .update(pubHex)
    .digest('hex')
    .substring(0, 16);

  return {
    publicKey: pubHex,
    privateKey: privHex,
    fingerprint,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Sign a message (typically a chainHash) with an Ed25519 private key.
 * Returns the signature as a hex string.
 */
export function signMessage(message: string, privateKeyHex: string): string {
  const keyObject = createPrivateKey({
    key: Buffer.from(privateKeyHex, 'hex'),
    format: 'der',
    type: 'pkcs8',
  });
  const signature = sign(null, Buffer.from(message, 'utf-8'), keyObject);
  return signature.toString('hex');
}

/**
 * Verify an Ed25519 signature against a message and public key.
 */
export function verifySignature(
  message: string,
  signatureHex: string,
  publicKeyHex: string,
): boolean {
  try {
    const keyObject = createPublicKey({
      key: Buffer.from(publicKeyHex, 'hex'),
      format: 'der',
      type: 'spki',
    });
    return verify(
      null,
      Buffer.from(message, 'utf-8'),
      keyObject,
      Buffer.from(signatureHex, 'hex'),
    );
  } catch {
    return false;
  }
}

/**
 * Compute the fingerprint (first 16 hex chars of SHA-256) of a public key.
 */
export function computeFingerprint(publicKeyHex: string): string {
  return createHash('sha256')
    .update(publicKeyHex)
    .digest('hex')
    .substring(0, 16);
}
