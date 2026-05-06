/**
 * Span — represents a single unit of work in an agent execution
 *
 * Usage:
 *   const span = tracer.startSpan('llm_call', { kind: 'llm_call' });
 *   span.setInput({ prompt: 'Hello' });
 *   span.addEvent('token_generated', { token: 'Hi' });
 *   span.setOutput({ response: 'Hi there' });
 *   span.end();
 */

import { randomUUID } from 'crypto';
import type { SpanKind, SpanStatus, SpanEvent, Span as CoreSpan } from '@yfwdecimal/core';

export interface SpanOptions {
  kind?: SpanKind;
  parentSpanId?: string;
  attributes?: Record<string, unknown>;
}

export class TracingSpan {
  public readonly spanId: string;
  public readonly traceId: string;
  public readonly sessionId: string;
  public readonly parentSpanId?: string;
  public readonly name: string;
  public readonly kind: SpanKind;
  public readonly startTime: string;

  private _endTime?: string;
  private _status: SpanStatus = 'running';
  private _attributes: Record<string, unknown>;
  private _events: SpanEvent[] = [];
  private _input?: unknown;
  private _output?: unknown;
  private _onEnd?: (span: TracingSpan) => void;

  constructor(
    name: string,
    traceId: string,
    sessionId: string,
    options: SpanOptions = {},
    onEnd?: (span: TracingSpan) => void,
  ) {
    this.spanId = randomUUID();
    this.traceId = traceId;
    this.sessionId = sessionId;
    this.parentSpanId = options.parentSpanId;
    this.name = name;
    this.kind = options.kind ?? 'custom';
    this.startTime = new Date().toISOString();
    this._attributes = options.attributes ?? {};
    this._onEnd = onEnd;
  }

  /** Set the input data for this span */
  setInput(input: unknown): this {
    this._input = input;
    return this;
  }

  /** Set the output data for this span */
  setOutput(output: unknown): this {
    this._output = output;
    return this;
  }

  /** Add a key-value attribute */
  setAttribute(key: string, value: unknown): this {
    this._attributes[key] = value;
    return this;
  }

  /** Merge multiple attributes */
  setAttributes(attrs: Record<string, unknown>): this {
    Object.assign(this._attributes, attrs);
    return this;
  }

  /** Record a discrete event within this span */
  addEvent(name: string, attributes?: Record<string, unknown>): this {
    this._events.push({ name, timestamp: new Date().toISOString(), attributes });
    return this;
  }

  /** Mark the span as errored */
  setError(error: Error | string): this {
    this._status = 'error';
    this._attributes['error'] = typeof error === 'string' ? error : error.message;
    if (error instanceof Error && error.stack) {
      this._attributes['error.stack'] = error.stack;
    }
    return this;
  }

  /** End the span and trigger the onEnd callback (signing + chaining) */
  end(): void {
    if (this._endTime) return; // Already ended
    this._endTime = new Date().toISOString();
    if (this._status === 'running') this._status = 'completed';
    this._onEnd?.(this);
  }

  /** Convert to the core Span type for signing */
  toSpan(): CoreSpan {
    return {
      spanId: this.spanId,
      traceId: this.traceId,
      parentSpanId: this.parentSpanId,
      sessionId: this.sessionId,
      name: this.name,
      kind: this.kind,
      startTime: this.startTime,
      endTime: this._endTime,
      status: this._status,
      attributes: this._attributes,
      events: this._events,
      input: this._input,
      output: this._output,
    };
  }

  get status(): SpanStatus { return this._status; }
  get endTime(): string | undefined { return this._endTime; }
  get isEnded(): boolean { return !!this._endTime; }
}
