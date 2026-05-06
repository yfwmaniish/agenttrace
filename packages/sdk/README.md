# @yfwdecimal/sdk

Agent instrumentation SDK for forensic auditing — auto-signing, hash-chaining, and framework adapters.

## Features

- **Auto-Signing** — Every span is automatically signed with Ed25519
- **Hash Chaining** — Records are cryptographically linked in sequence
- **LangChain Adapter** — Drop-in callback handler for LangChain agents
- **Generic Adapter** — Wrap any function with forensic tracing
- **HTTP Transport** — Batched sending with retry logic
- **TypeScript-first** — Full type safety with exported types

## Install

```bash
npm install @yfwdecimal/sdk
```

## Quick Start

```typescript
import { AgentTraceClient } from '@yfwdecimal/sdk';

const client = new AgentTraceClient({
  endpoint: 'http://localhost:4000',
  agentId: 'my-agent',
  projectId: 'my-project',
});

// Create a traced span
const span = client.startSpan('GPT-4 Inference', 'llm_call');
span.setInput({ model: 'gpt-4', prompt: 'Analyze this...' });

const result = await callLLM();

span.setOutput({ tokens: 342, response: result });
span.end();

// Send all pending records
await client.flush();
```

## LangChain Integration

```typescript
import { AgentTraceCallbackHandler } from '@yfwdecimal/sdk/adapters/langchain';

const handler = new AgentTraceCallbackHandler(client);
const agent = new AgentExecutor({ callbacks: [handler] });
// All LLM calls and tool invocations are automatically traced
```

## Generic Adapter

```typescript
import { GenericAdapter } from '@yfwdecimal/sdk/adapters/generic';

const adapter = new GenericAdapter(client);

// Wrap any async function with forensic tracing
const result = await adapter.trace('Data Processing', 'tool_invoke', async (span) => {
  span.setInput({ source: 'database' });
  const data = await processData();
  span.setOutput({ rows: data.length });
  return data;
});
```

## Offline / Testing Mode

```typescript
const client = new AgentTraceClient({
  transport: 'noop', // No network calls — records stay local
  agentId: 'test-agent',
});
```

## License

MIT
