/**
 * export — Generate compliance evidence packages.
 *
 * Usage: agenttrace export <file> [--standard ISO_42001|ISO_27001|NIST_AI_RMF] [--output <path>]
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { parseArgs } from 'node:util';
import { verifyChain, buildMerkleTree, computeMerkleRoot } from '@yfwdecimal/core';
import type { TraceRecord } from '@yfwdecimal/core';
import { c, heading, keyValue, hashDisplay, success, info } from '../ui.js';

const STANDARD_DETAILS: Record<string, { name: string; section: string; description: string }> = {
  ISO_42001: { name: 'ISO/IEC 42001:2023', section: 'A.6.2.8', description: 'AI Management System — Decision audit trail requirements' },
  ISO_27001: { name: 'ISO/IEC 27001:2022', section: 'A.8.15', description: 'Information Security — Event logging controls' },
  NIST_AI_RMF: { name: 'NIST AI RMF 1.0', section: 'MG-3.2', description: 'AI Risk Management Framework — Measurement' },
  SOC2_TYPE2: { name: 'SOC 2 Type II', section: 'PI1', description: 'Trust Service Criteria — Processing Integrity' },
};

export async function exportCmd(args: string[]) {
  const { values, positionals } = parseArgs({
    args,
    allowPositionals: true,
    options: {
      standard: { type: 'string', default: 'ISO_42001' },
      output: { type: 'string', short: 'o' },
    },
  });

  const filePath = positionals[0];
  if (!filePath) {
    throw new Error('Missing file path. Usage: agenttrace export <file.json> [--standard ISO_42001]');
  }

  const standard = values.standard as string;
  if (!STANDARD_DETAILS[standard]) {
    throw new Error(`Unknown standard: ${standard}. Available: ${Object.keys(STANDARD_DETAILS).join(', ')}`);
  }

  info(`Loading trace file: ${c.cyan}${filePath}${c.reset}`);
  const raw = readFileSync(filePath, 'utf-8');
  const data = JSON.parse(raw);
  const records: TraceRecord[] = Array.isArray(data) ? data : data.records || [];

  info(`Generating ${c.bold}${STANDARD_DETAILS[standard].name}${c.reset} compliance evidence...`);

  const verification = verifyChain(records);
  const hashes = records
    .sort((a, b) => a.sequenceNumber - b.sequenceNumber)
    .map(r => r.chainHash);
  const merkleRoot = computeMerkleRoot(hashes);

  const report = {
    _meta: {
      generator: 'AgentTrace CLI v0.1.0',
      generatedAt: new Date().toISOString(),
      standard: STANDARD_DETAILS[standard],
    },
    summary: {
      totalRecords: records.length,
      chainIntegrity: verification.valid ? 'VERIFIED' : 'COMPROMISED',
      errors: verification.errors.length,
      merkleRoot,
      hashAlgorithm: 'SHA-256 (FIPS 180-4)',
      signatureAlgorithm: 'Ed25519 (RFC 8032)',
      firstRecord: verification.firstRecord,
      lastRecord: verification.lastRecord,
    },
    verification,
    records: records.sort((a, b) => a.sequenceNumber - b.sequenceNumber).map(r => ({
      sequence: r.sequenceNumber,
      spanName: r.span.name,
      spanKind: r.span.kind,
      status: r.span.status,
      startTime: r.span.startTime,
      endTime: r.span.endTime,
      contentHash: r.contentHash,
      chainHash: r.chainHash,
      signature: r.signature,
      publicKey: r.publicKey,
    })),
  };

  if (values.output) {
    writeFileSync(values.output, JSON.stringify(report, null, 2));
    heading('Export Complete');
    success(`Report written to ${c.cyan}${values.output}${c.reset}`);
  } else {
    console.log(JSON.stringify(report, null, 2));
  }

  if (values.output) {
    keyValue('Standard', STANDARD_DETAILS[standard].name);
    keyValue('Section', STANDARD_DETAILS[standard].section);
    keyValue('Records', records.length.toString());
    keyValue('Integrity', verification.valid ? `${c.green}VERIFIED${c.reset}` : `${c.red}COMPROMISED${c.reset}`);
    hashDisplay('Merkle Root', merkleRoot);
  }
}
