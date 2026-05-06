/**
 * inspect — View trace record details, timeline, and span metadata.
 *
 * Usage: agenttrace inspect <file> [--verbose] [--format json|table]
 */

import { readFileSync } from 'node:fs';
import { parseArgs } from 'node:util';
import type { TraceRecord } from '@yfwdecimal/core';
import { c, heading, keyValue, hashDisplay, info, table } from '../ui.js';

export async function inspect(args: string[]) {
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
    throw new Error('Missing file path. Usage: agenttrace inspect <file.json>');
  }

  info(`Loading trace file: ${c.cyan}${filePath}${c.reset}`);
  const raw = readFileSync(filePath, 'utf-8');
  const data = JSON.parse(raw);
  const records: TraceRecord[] = Array.isArray(data) ? data : data.records || [];

  if (records.length === 0) {
    throw new Error('No trace records found in file.');
  }

  const sorted = records.sort((a, b) => a.sequenceNumber - b.sequenceNumber);

  if (values.format === 'json') {
    console.log(JSON.stringify(sorted, null, 2));
    return;
  }

  // Session summary
  heading('Session Summary');
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  keyValue('Session ID', first.span.sessionId);
  keyValue('Records', `${sorted.length}`);
  keyValue('Time Range', `${first.span.startTime} → ${last.span.endTime || 'running'}`);
  hashDisplay('First Hash', first.chainHash);
  hashDisplay('Last Hash', last.chainHash);
  keyValue('Public Key', first.publicKey.slice(0, 24) + '...');

  // Kind distribution
  heading('Span Distribution');
  const kindCounts: Record<string, number> = {};
  const statusCounts: Record<string, number> = {};
  sorted.forEach(r => {
    kindCounts[r.span.kind] = (kindCounts[r.span.kind] || 0) + 1;
    statusCounts[r.span.status] = (statusCounts[r.span.status] || 0) + 1;
  });

  const kindRows = Object.entries(kindCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([kind, count]) => {
      const pct = Math.round((count / sorted.length) * 100);
      const bar = '█'.repeat(Math.round(pct / 5)) + '░'.repeat(20 - Math.round(pct / 5));
      return [kind, count.toString(), `${c.cyan}${bar}${c.reset} ${pct}%`];
    });
  table(['KIND', 'COUNT', 'DISTRIBUTION'], kindRows);

  console.log('');
  const statusRows = Object.entries(statusCounts).map(([status, count]) => {
    const color = status === 'completed' ? c.green : status === 'error' ? c.red : c.yellow;
    return [status, `${color}${count}${c.reset}`];
  });
  table(['STATUS', 'COUNT'], statusRows);

  // Timeline
  heading('Execution Timeline');
  const timelineRows = sorted.map(r => {
    const kindColor = r.span.kind === 'llm_call' ? c.green
      : r.span.kind === 'tool_invoke' ? c.yellow
      : r.span.kind === 'custom' ? c.magenta
      : c.blue;
    const statusIcon = r.span.status === 'completed' ? `${c.green}✓${c.reset}`
      : r.span.status === 'error' ? `${c.red}✗${c.reset}` : `${c.yellow}~${c.reset}`;

    return [
      `#${r.sequenceNumber}`,
      `${kindColor}${r.span.kind}${c.reset}`,
      r.span.name,
      statusIcon,
      `${c.gray}${r.chainHash.slice(0, 12)}...${c.reset}`,
    ];
  });
  table(['SEQ', 'KIND', 'NAME', 'ST', 'CHAIN HASH'], timelineRows);

  // Verbose: full record detail
  if (values.verbose) {
    heading('Record Details');
    sorted.forEach(r => {
      console.log(`\n  ${c.bold}#${r.sequenceNumber} — ${r.span.name}${c.reset} ${c.gray}(${r.span.kind})${c.reset}`);
      keyValue('  Span ID', r.span.spanId);
      keyValue('  Trace ID', r.span.traceId);
      if (r.span.parentSpanId) keyValue('  Parent', r.span.parentSpanId);
      keyValue('  Start', r.span.startTime);
      keyValue('  End', r.span.endTime || '—');
      keyValue('  Status', r.span.status);
      if (r.span.input) keyValue('  Input', JSON.stringify(r.span.input).slice(0, 60));
      if (r.span.output) keyValue('  Output', JSON.stringify(r.span.output).slice(0, 60));
      hashDisplay('  Content Hash', r.contentHash);
      hashDisplay('  Chain Hash', r.chainHash);
      hashDisplay('  Previous Hash', r.previousHash);
      console.log(`  ${c.gray}${'Signature'.padEnd(20)}${c.reset} ${c.dim}σ ${r.signature.slice(0, 32)}...${c.reset}`);
    });
  }
}
