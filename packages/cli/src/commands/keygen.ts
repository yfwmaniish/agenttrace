/**
 * keygen — Generate a new Ed25519 keypair for trace signing.
 *
 * Usage: agenttrace keygen [--output <path>]
 */

import { writeFileSync } from 'node:fs';
import { parseArgs } from 'node:util';
import { generateKeyPair } from '@yfwdecimal/core';
import { c, heading, keyValue, hashDisplay, success, info } from '../ui.js';

export async function keygen(args: string[]) {
  const { values } = parseArgs({
    args,
    options: {
      output: { type: 'string', short: 'o' },
    },
  });

  info('Generating Ed25519 keypair...');
  const keyPair = generateKeyPair();

  heading('New Keypair Generated');
  keyValue('Algorithm', 'Ed25519 (RFC 8032)');
  keyValue('Fingerprint', `${c.cyan}${keyPair.fingerprint}${c.reset}`);
  keyValue('Created', keyPair.createdAt);
  hashDisplay('Public Key', keyPair.publicKey);

  if (values.output) {
    const keyData = {
      algorithm: 'Ed25519',
      fingerprint: keyPair.fingerprint,
      publicKey: keyPair.publicKey,
      privateKey: keyPair.privateKey,
      createdAt: keyPair.createdAt,
    };
    writeFileSync(values.output, JSON.stringify(keyData, null, 2));
    success(`Keypair saved to ${c.cyan}${values.output}${c.reset}`);
    console.log(`\n  ${c.yellow}⚠ Keep the private key secure. Never share or commit it.${c.reset}`);
  } else {
    console.log(`\n  ${c.gray}Public Key:${c.reset}`);
    console.log(`  ${c.cyan}${keyPair.publicKey}${c.reset}`);
    console.log(`\n  ${c.gray}Private Key:${c.reset}`);
    console.log(`  ${c.dim}${keyPair.privateKey}${c.reset}`);
    console.log(`\n  ${c.yellow}⚠ Use --output <file> to save securely.${c.reset}`);
  }
}
