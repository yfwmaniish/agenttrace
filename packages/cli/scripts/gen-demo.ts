/**
 * Generate demo trace file for CLI testing.
 * Run: node --loader ts-node/esm packages/cli/scripts/gen-demo.ts
 */
import { generateKeyPair, createTraceRecord } from '@yfwdecimal/core';

const GENESIS = '0'.repeat(64);

function buildDemoTraces() {
  const keyPair = generateKeyPair();
  const sessionId = 'sess-demo-001';
  const traceId = 'trace-demo-001';
  const records = [];
  let prevHash = GENESIS;

  const spans = [
    { name: 'Initialize Agent', kind: 'agent_step' as const, input: { config: 'research-mode' }, output: { status: 'ready' } },
    { name: 'User Query Received', kind: 'agent_step' as const, input: { query: 'Explain quantum computing' }, output: { parsed: true } },
    { name: 'GPT-4 Inference', kind: 'llm_call' as const, input: { model: 'gpt-4', prompt: 'Explain quantum computing in simple terms' }, output: { tokens: 342, response: 'Quantum computing uses qubits...' } },
    { name: 'Web Search', kind: 'tool_invoke' as const, input: { tool: 'brave_search', query: 'quantum computing basics 2025' }, output: { results: 5 } },
    { name: 'RAG Retrieval', kind: 'retrieval' as const, input: { source: 'knowledge_base', query: 'quantum computing' }, output: { documents: 3, relevance: 0.92 } },
    { name: 'Synthesize Response', kind: 'llm_call' as const, input: { model: 'gpt-4', context: '5 web results + 3 documents' }, output: { tokens: 567, response: 'Based on my research...' } },
    { name: 'Safety Check', kind: 'agent_step' as const, input: { check: 'content_safety' }, output: { safe: true, score: 0.99 } },
    { name: 'Deliver Response', kind: 'agent_step' as const, input: { channel: 'chat' }, output: { delivered: true, latency: '1.2s' } },
  ];

  for (let i = 0; i < spans.length; i++) {
    const s = spans[i];
    const now = new Date(Date.now() + i * 2000).toISOString();
    const span = {
      spanId: `span-${i.toString().padStart(3, '0')}`,
      traceId,
      parentSpanId: i > 0 ? 'span-000' : undefined,
      sessionId,
      name: s.name,
      kind: s.kind,
      startTime: now,
      endTime: new Date(Date.parse(now) + 1500).toISOString(),
      status: 'completed' as const,
      attributes: {},
      events: [],
      input: s.input,
      output: s.output,
    };

    const record = createTraceRecord(span, prevHash, i, keyPair.privateKey, keyPair.publicKey);
    records.push(record);
    prevHash = record.chainHash;
  }

  return records;
}

const records = buildDemoTraces();
const json = JSON.stringify(records, null, 2);

// Write to stdout
process.stdout.write(json);
