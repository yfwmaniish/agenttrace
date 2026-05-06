/**
 * @yfwdecimal/sdk — Public API
 *
 * TypeScript SDK for instrumenting AI agents with tamper-evident traces.
 */

// Client
export { AgentTraceClient } from './client.js';

// Span
export { TracingSpan, type SpanOptions } from './span.js';

// Transport
export { HttpTransport, NoopTransport } from './transport.js';

// Adapters
export { LangChainAdapter, GenericAdapter } from './adapters/index.js';

// Types
export type { AgentTraceOptions, Transport, FlushResult } from './types.js';

// Re-export core types users need
export type { Span, SpanKind, SpanStatus, TraceRecord, KeyPair, VerificationResult } from '@yfwdecimal/core';
export { verifyChain, findTamperPoint, generateKeyPair } from '@yfwdecimal/core';
