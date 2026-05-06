/**
 * AgentTrace Client — main SDK entry point
 *
 * Usage:
 *   const at = new AgentTraceClient({ apiKey: 'at_xxx', endpoint: 'http://localhost:3001/api' });
 *   const span = at.startSpan('llm_call', { kind: 'llm_call' });
 *   span.setInput({ prompt: 'Hello' });
 *   span.setOutput({ response: 'Hi' });
 *   span.end(); // auto-signs, hash-chains, queues for transport
 *   await at.flush(); // send buffered records to server
 */

import { randomUUID } from 'crypto';
import { HashChain, generateKeyPair, computeMerkleRoot } from '@yfwdecimal/core';
import type { TraceRecord, KeyPair } from '@yfwdecimal/core';
import { TracingSpan, type SpanOptions } from './span.js';
import { HttpTransport, NoopTransport } from './transport.js';
import type { AgentTraceOptions, Transport } from './types.js';

export class AgentTraceClient {
  private readonly chain: HashChain;
  private readonly keyPair: KeyPair;
  private readonly transport: Transport;
  private readonly projectId: string;
  private readonly sessionId: string;
  private readonly buffer: TraceRecord[] = [];
  private readonly batchSize: number;
  private flushTimer?: ReturnType<typeof setInterval>;
  private activeSpans = new Map<string, TracingSpan>();

  constructor(options: AgentTraceOptions = {}) {
    this.keyPair = options.keyPair ?? generateKeyPair();
    this.projectId = options.projectId ?? 'default';
    this.sessionId = randomUUID();
    this.batchSize = options.batchSize ?? 10;

    this.chain = new HashChain(this.keyPair.privateKey, this.keyPair.publicKey);

    // Set up transport
    if (options.endpoint) {
      this.transport = new HttpTransport(
        options.endpoint,
        options.apiKey,
      );
    } else {
      this.transport = new NoopTransport();
    }

    // Auto-flush timer
    const flushMs = options.flushIntervalMs ?? 5000;
    if (flushMs > 0) {
      this.flushTimer = setInterval(() => this.flush().catch(() => {}), flushMs);
    }
  }

  /** Start a new span — call span.end() when done */
  startSpan(name: string, options: SpanOptions = {}): TracingSpan {
    const traceId = options.parentSpanId
      ? this.findParentTraceId(options.parentSpanId) ?? randomUUID()
      : randomUUID();

    const span = new TracingSpan(name, traceId, this.sessionId, options, (s) => this.onSpanEnd(s));
    this.activeSpans.set(span.spanId, span);
    return span;
  }

  /** Create a child span under a parent */
  startChildSpan(name: string, parentSpan: TracingSpan, options: Omit<SpanOptions, 'parentSpanId'> = {}): TracingSpan {
    return this.startSpan(name, { ...options, parentSpanId: parentSpan.spanId });
  }

  /** Wrap an async function with automatic span instrumentation */
  async trace<T>(name: string, fn: (span: TracingSpan) => Promise<T>, options: SpanOptions = {}): Promise<T> {
    const span = this.startSpan(name, options);
    try {
      const result = await fn(span);
      span.setOutput(result);
      span.end();
      return result;
    } catch (err) {
      span.setError(err as Error);
      span.end();
      throw err;
    }
  }

  /** Flush all buffered records to the server */
  async flush(): Promise<void> {
    if (this.buffer.length === 0) return;
    const records = this.buffer.splice(0);
    await this.transport.send(records, this.sessionId, this.projectId);
  }

  /** Shutdown — flush remaining records and stop timers */
  async shutdown(): Promise<void> {
    if (this.flushTimer) clearInterval(this.flushTimer);
    await this.flush();
  }

  /** Get all records in the current chain (for local inspection) */
  getRecords(): readonly TraceRecord[] {
    return this.chain.getRecords();
  }

  /** Get the current session ID */
  getSessionId(): string {
    return this.sessionId;
  }

  /** Get the signing keypair */
  getKeyPair(): KeyPair {
    return this.keyPair;
  }

  /** Compute Merkle root of all current records */
  getMerkleRoot(): string {
    const hashes = this.chain.getRecords().map((r) => r.chainHash);
    return computeMerkleRoot(hashes);
  }

  /** Get chain length */
  get chainLength(): number {
    return this.chain.length;
  }

  // --- Internal ---

  private onSpanEnd(span: TracingSpan): void {
    this.activeSpans.delete(span.spanId);
    const record = this.chain.append(span.toSpan());
    this.buffer.push(record);

    if (this.buffer.length >= this.batchSize) {
      this.flush().catch(() => {});
    }
  }

  private findParentTraceId(parentSpanId: string): string | undefined {
    return this.activeSpans.get(parentSpanId)?.traceId;
  }
}
