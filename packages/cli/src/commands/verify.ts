/**
 * verify — Cryptographically verify the integrity of a trace chain.
 *
 * Usage: agenttrace verify <file> [--verbose] [--format json|table]
 */

import { readFileSync } from 'node:fs';
import { parseArgs } from 'node:util';
import { verifyChain, findTamperPoint } from '@yfwdecimal/core';
import type { TraceRecord } from '@yfwdecimal/core';
import { c, heading, keyValue, hashDisplay, success, fail, warn, info, table, progressBar } from '../ui.js';

export async function verify(args: string[]) {
  const { values, positionals } = parseArgs({
    args,
    allowPositionals: true,
    options: {
      verbose: { type: 'boolean', default: false },
      format: { type: 'string', default: 'table' },
    },
  });

  const filePath = positionals[0];
  if (!filePath) {
    throw new Error('Missing file path. Usage: agenttrace verify <file.json>');
  }

  info(`Loading trace file: ${c.cyan}${filePath}${c.reset}`);
  const raw = readFileSync(filePath, 'utf-8');
  const data = JSON.parse(raw);
  const records: TraceRecord[] = Array.isArray(data) ? data : data.records || [];

  if (records.length === 0) {
    throw new Error('No trace records found in file.');
  }

  info(`Found ${c.bold}${records.length}${c.reset} records. Verifying chain...`);

  const startTime = performance.now();
  const result = verifyChain(records);
  const duration = (performance.now() - startTime).toFixed(1);

  if (values.format === 'json') {
    console.log(JSON.stringify({ ...result, duration: `${duration}ms` }, null, 2));
    return;
  }

  heading('Chain Verification Result');

  if (result.valid) {
    console.log(`  ${c.bgGreen}${c.bold} PASS ${c.reset} ${c.green}Chain Integrity VERIFIED${c.reset}\n`);
  } else {
    console.log(`  ${c.bgRed}${c.bold} FAIL ${c.reset} ${c.red}TAMPERING DETECTED${c.reset}\n`);
  }

  keyValue('Chain Length', `${result.chainLength} records`);
  keyValue('Integrity', progressBar(result.chainLength - result.errors.length, result.chainLength));
  keyValue('Duration', `${duration}ms`);
  keyValue('Verified At', result.verifiedAt);
  if (result.firstRecord) hashDisplay('First Record', result.firstRecord);
  if (result.lastRecord) hashDisplay('Last Record', result.lastRecord);

  if (result.errors.length > 0) {
    heading('Tamper Points');
    result.errors.forEach((err, i) => {
      console.log(`  ${c.red}${i + 1}.${c.reset} ${c.bold}${err.type}${c.reset}`);
      console.log(`     ${c.gray}Record:${c.reset} ${err.recordId}`);
      console.log(`     ${c.gray}Detail:${c.reset} ${err.message}\n`);
    });
  }

  if (values.verbose && result.valid) {
    heading('Record Summary');
    const rows = records
      .sort((a, b) => a.sequenceNumber - b.sequenceNumber)
      .map(r => [
        `#${r.sequenceNumber}`,
        r.span.name,
        r.span.kind,
        r.chainHash.slice(0, 12) + '...',
        `σ ${r.signature.slice(0, 10)}...`,
      ]);
    table(['SEQ', 'NAME', 'KIND', 'CHAIN HASH', 'SIGNATURE'], rows);
  }

  process.exit(result.valid ? 0 : 1);
}
