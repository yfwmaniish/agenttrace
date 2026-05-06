/**
 * Generic Adapter — manual instrumentation helpers
 *
 * For agents that don't use LangChain or Vercel AI SDK.
 *
 * Usage:
 *   const tracer = new GenericAdapter(client);
 *   const result = await tracer.traceLLMCall('gpt-4', { prompt: 'Hello' }, async () => {
 *     return await callMyLLM('Hello');
 *   });
 */

import { AgentTraceClient } from '../client.js';
import type { SpanKind } from '@yfwdecimal/core';

export class GenericAdapter {
  constructor(private readonly client: AgentTraceClient) {}

  /** Trace an LLM call */
  async traceLLMCall<T>(model: string, input: unknown, fn: () => Promise<T>): Promise<T> {
    return this.client.trace('llm_call', async (span) => {
      span.setAttribute('llm.model', model);
      span.setInput(input);
      const result = await fn();
      return result;
    }, { kind: 'llm_call' });
  }

  /** Trace a tool invocation */
  async traceToolCall<T>(toolName: string, input: unknown, fn: () => Promise<T>): Promise<T> {
    return this.client.trace(toolName, async (span) => {
      span.setAttribute('tool.name', toolName);
      span.setInput(input);
      const result = await fn();
      return result;
    }, { kind: 'tool_invoke' });
  }

  /** Trace a retrieval/RAG operation */
  async traceRetrieval<T>(source: string, query: unknown, fn: () => Promise<T>): Promise<T> {
    return this.client.trace('retrieval', async (span) => {
      span.setAttribute('retrieval.source', source);
      span.setInput(query);
      const result = await fn();
      return result;
    }, { kind: 'retrieval' });
  }

  /** Trace any custom operation */
  async traceCustom<T>(name: string, kind: SpanKind, input: unknown, fn: () => Promise<T>): Promise<T> {
    return this.client.trace(name, async (span) => {
      span.setInput(input);
      const result = await fn();
      return result;
    }, { kind });
  }
}
