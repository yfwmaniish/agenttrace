/**
 * @yfwdecimal/sdk — Core types for the SDK layer
 */

import type { Span, SpanKind, SpanStatus, SpanEvent, TraceRecord, KeyPair } from '@yfwdecimal/core';

/** Options for initializing the AgentTrace SDK */
export interface AgentTraceOptions {
  /** API key for authenticating with the AgentTrace server */
  apiKey?: string;
  /** API endpoint URL (default: http://localhost:3001/api) */
  endpoint?: string;
  /** Project ID */
  projectId?: string;
  /** Ed25519 keypair for signing (auto-generated if not provided) */
  keyPair?: KeyPair;
  /** Enable auto-signing of spans (default: true) */
  autoSign?: boolean;
  /** Batch size before flushing to server (default: 10) */
  batchSize?: number;
  /** Flush interval in ms (default: 5000) */
  flushIntervalMs?: number;
  /** Enable local SQLite fallback (default: false) */
  localFallback?: boolean;
  /** Session name for grouping traces */
  sessionName?: string;
}

/** Mutable span builder — used during span lifecycle */
export interface SpanBuilder {
  spanId: string;
  traceId: string;
  parentSpanId?: string;
  sessionId: string;
  name: string;
  kind: SpanKind;
  startTime: string;
  endTime?: string;
  status: SpanStatus;
  attributes: Record<string, unknown>;
  events: SpanEvent[];
  input?: unknown;
  output?: unknown;
}

/** Transport interface for sending records to the server */
export interface Transport {
  send(records: TraceRecord[], sessionId: string, projectId: string): Promise<void>;
  flush(): Promise<void>;
}

/** Result of a flush operation */
export interface FlushResult {
  sent: number;
  failed: number;
  errors: Error[];
}
