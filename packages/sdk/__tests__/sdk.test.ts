import { describe, it, expect } from 'vitest';
import { AgentTraceClient, TracingSpan, GenericAdapter, LangChainAdapter } from '../src/index.js';
import { verifyChain } from '@yfwdecimal/core';

describe('AgentTraceClient', () => {
  it('initializes with auto-generated keypair', () => {
    const client = new AgentTraceClient();
    expect(client.getKeyPair().publicKey).toBeTruthy();
    expect(client.getSessionId()).toBeTruthy();
    expect(client.chainLength).toBe(0);
  });

  it('creates and ends spans, producing signed records', () => {
    const client = new AgentTraceClient({ flushIntervalMs: 0 });
    const span = client.startSpan('test_span', { kind: 'llm_call' });
    span.setInput({ prompt: 'Hello' });
    span.setOutput({ response: 'Hi' });
    span.end();

    expect(client.chainLength).toBe(1);
    const records = client.getRecords();
    expect(records[0].span.name).toBe('test_span');
    expect(records[0].signature).toBeTruthy();
    expect(records[0].chainHash).toBeTruthy();
  });

  it('chains multiple spans correctly', () => {
    const client = new AgentTraceClient({ flushIntervalMs: 0 });

    const s1 = client.startSpan('step_1', { kind: 'agent_step' });
    s1.end();
    const s2 = client.startSpan('step_2', { kind: 'llm_call' });
    s2.setInput({ prompt: 'test' });
    s2.end();
    const s3 = client.startSpan('step_3', { kind: 'tool_invoke' });
    s3.end();

    expect(client.chainLength).toBe(3);
    const records = client.getRecords();
    // Verify chain linkage
    expect(records[1].previousHash).toBe(records[0].chainHash);
    expect(records[2].previousHash).toBe(records[1].chainHash);
  });

  it('produces a valid chain that passes verification', () => {
    const client = new AgentTraceClient({ flushIntervalMs: 0 });
    for (let i = 0; i < 5; i++) {
      const span = client.startSpan(`action_${i}`, { kind: 'agent_step' });
      span.setInput({ step: i });
      span.setOutput({ result: `done_${i}` });
      span.end();
    }

    const result = verifyChain([...client.getRecords()]);
    expect(result.valid).toBe(true);
    expect(result.chainLength).toBe(5);
  });

  it('trace() wrapper auto-instruments async functions', async () => {
    const client = new AgentTraceClient({ flushIntervalMs: 0 });
    const result = await client.trace('my_operation', async (span) => {
      span.setInput({ query: 'test' });
      return { answer: 42 };
    }, { kind: 'custom' });

    expect(result).toEqual({ answer: 42 });
    expect(client.chainLength).toBe(1);
  });

  it('trace() captures errors and still signs the span', async () => {
    const client = new AgentTraceClient({ flushIntervalMs: 0 });
    await expect(
      client.trace('failing_op', async () => { throw new Error('boom'); })
    ).rejects.toThrow('boom');

    expect(client.chainLength).toBe(1);
    const records = client.getRecords();
    expect(records[0].span.status).toBe('error');
  });

  it('computes Merkle root', () => {
    const client = new AgentTraceClient({ flushIntervalMs: 0 });
    const s1 = client.startSpan('a'); s1.end();
    const s2 = client.startSpan('b'); s2.end();
    const root = client.getMerkleRoot();
    expect(root).toBeTruthy();
    expect(root.length).toBe(64); // SHA-256 hex
  });

  it('supports child spans', () => {
    const client = new AgentTraceClient({ flushIntervalMs: 0 });
    const parent = client.startSpan('agent_step', { kind: 'agent_step' });
    const child = client.startChildSpan('llm_call', parent, { kind: 'llm_call' });
    child.end();
    parent.end();

    expect(client.chainLength).toBe(2);
    const records = client.getRecords();
    expect(records[0].span.parentSpanId).toBe(parent.spanId);
  });
});

describe('TracingSpan', () => {
  it('tracks attributes and events', () => {
    const span = new TracingSpan('test', 'trace-1', 'session-1', { kind: 'llm_call' });
    span.setAttribute('model', 'gpt-4');
    span.setAttributes({ temperature: 0.7, maxTokens: 100 });
    span.addEvent('token_generated', { count: 50 });

    const coreSpan = span.toSpan();
    expect(coreSpan.attributes).toEqual({ model: 'gpt-4', temperature: 0.7, maxTokens: 100 });
    expect(coreSpan.events).toHaveLength(1);
    expect(coreSpan.events[0].name).toBe('token_generated');
  });

  it('handles errors', () => {
    const span = new TracingSpan('test', 'trace-1', 'session-1');
    span.setError(new Error('something broke'));
    span.end();

    expect(span.status).toBe('error');
    expect(span.toSpan().attributes['error']).toBe('something broke');
  });

  it('end() is idempotent', () => {
    let endCount = 0;
    const span = new TracingSpan('test', 't', 's', {}, () => { endCount++; });
    span.end();
    span.end();
    expect(endCount).toBe(1);
  });
});

describe('GenericAdapter', () => {
  it('traceLLMCall produces signed records', async () => {
    const client = new AgentTraceClient({ flushIntervalMs: 0 });
    const adapter = new GenericAdapter(client);

    const result = await adapter.traceLLMCall('gpt-4', { prompt: 'Hi' }, async () => 'Hello!');
    expect(result).toBe('Hello!');
    expect(client.chainLength).toBe(1);
    expect(client.getRecords()[0].span.kind).toBe('llm_call');
  });

  it('traceToolCall captures tool name', async () => {
    const client = new AgentTraceClient({ flushIntervalMs: 0 });
    const adapter = new GenericAdapter(client);

    await adapter.traceToolCall('web_search', { query: 'test' }, async () => ({ results: [] }));
    expect(client.getRecords()[0].span.name).toBe('web_search');
    expect(client.getRecords()[0].span.kind).toBe('tool_invoke');
  });
});

describe('LangChainAdapter', () => {
  it('traces LLM start/end lifecycle', () => {
    const client = new AgentTraceClient({ flushIntervalMs: 0 });
    const handler = new LangChainAdapter(client);

    handler.handleLLMStart({ name: 'gpt-4' }, ['Hello'], 'run-1');
    handler.handleLLMEnd({ generations: [[{ text: 'Hi' }]] }, 'run-1');

    expect(client.chainLength).toBe(1);
    expect(client.getRecords()[0].span.kind).toBe('llm_call');
  });

  it('traces tool invocations', () => {
    const client = new AgentTraceClient({ flushIntervalMs: 0 });
    const handler = new LangChainAdapter(client);

    handler.handleToolStart({ name: 'calculator' }, '2+2', 'run-2');
    handler.handleToolEnd('4', 'run-2');

    expect(client.chainLength).toBe(1);
    expect(client.getRecords()[0].span.kind).toBe('tool_invoke');
  });

  it('captures errors', () => {
    const client = new AgentTraceClient({ flushIntervalMs: 0 });
    const handler = new LangChainAdapter(client);

    handler.handleLLMStart({ name: 'gpt-4' }, ['test'], 'run-3');
    handler.handleLLMError(new Error('rate limited'), 'run-3');

    expect(client.getRecords()[0].span.status).toBe('error');
  });
});
