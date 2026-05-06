<p align="center">
  <img src="https://img.shields.io/badge/AgentTrace-Forensic%20Audit-00d4aa?style=for-the-badge&logo=shield&logoColor=white" alt="AgentTrace" />
</p>

<h1 align="center">AgentTrace</h1>
<p align="center">
  <strong>Cryptographic forensic audit trail for AI agent decisions</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/SHA--256-FIPS%20180--4-10b981?style=flat-square" alt="SHA-256" />
  <img src="https://img.shields.io/badge/Ed25519-RFC%208032-10b981?style=flat-square" alt="Ed25519" />
  <img src="https://img.shields.io/badge/ISO%2042001-Compliant-10b981?style=flat-square" alt="ISO 42001" />
  <img src="https://img.shields.io/badge/Tests-50%20passing-10b981?style=flat-square" alt="Tests" />
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178c6?style=flat-square&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Python-3.9+-3776ab?style=flat-square&logo=python" alt="Python" />
</p>

---

## 🔍 What is AgentTrace?

**AgentTrace** is a production-grade forensic audit system for AI agents. Every decision, tool call, and LLM inference is captured in a **tamper-proof, cryptographically signed hash chain** — creating an immutable evidence trail that meets compliance standards.

### The Problem

AI agents are making consequential decisions — financial trades, medical recommendations, code deployments — but there's no way to prove **what an agent did, why it did it, or if the logs were tampered with**.

### The Solution

AgentTrace creates blockchain-style audit trails for AI agents:

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│ Record 0 │───▶│ Record 1 │───▶│ Record 2 │───▶│ Record 3 │
│ SHA-256  │    │ SHA-256  │    │ SHA-256  │    │ SHA-256  │
│ Ed25519σ │    │ Ed25519σ │    │ Ed25519σ │    │ Ed25519σ │
└──────────┘    └──────────┘    └──────────┘    └──────────┘
     │                │                │                │
     └────────────────┴────────────────┴────────────────┘
                    Merkle Root → Git Anchor
```

**If any record is modified, all subsequent hashes break → tampering is instantly detectable.**

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        AgentTrace                           │
├──────────────┬──────────────┬───────────────┬───────────────┤
│   @core      │   @sdk       │   Dashboard   │   CLI         │
│              │              │               │               │
│ • SHA-256    │ • TS Client  │ • Next.js 15  │ • verify      │
│ • Ed25519    │ • LangChain  │ • Chain Viz   │ • inspect     │
│ • Hash Chain │ • Python SDK │ • Compliance  │ • export      │
│ • Merkle     │ • Adapters   │ • Tamper UI   │ • keygen      │
│ • Verify     │ • Transport  │ • Export      │ • status      │
└──────────────┴──────────────┴───────────────┴───────────────┘
```

| Package | Description | Tech |
|---------|-------------|------|
| `@yfwdecimal/core` | Cryptographic engine | SHA-256, Ed25519, Merkle trees |
| `@yfwdecimal/sdk` | Agent instrumentation | TypeScript, LangChain adapter |
| `python-sdk` | Python instrumentation | Ed25519, context managers |
| `apps/dashboard` | Compliance dashboard | Next.js 15, Tailwind |
| `apps/api` | Append-only API | Fastify, Prisma 7, PostgreSQL |
| `@yfwdecimal/cli` | Forensic audit CLI | Node.js, zero external deps |

---

## 🚀 Quick Start

### Prerequisites

- Node.js ≥ 18
- pnpm ≥ 9
- Python ≥ 3.9 (for Python SDK)

### Install & Build

```bash
git clone https://github.com/your-org/agenttrace.git
cd agenttrace
pnpm install
pnpm build
```

### Run Tests

```bash
# TypeScript tests (40 tests)
pnpm test

# Python SDK tests (10 tests)
cd packages/python-sdk && pytest tests/
```

### Launch Dashboard

```bash
cd apps/dashboard
npm run dev
# → http://localhost:3000
```

### Try the CLI

```bash
# Generate demo traces
node packages/cli/scripts/gen-demo.mjs

# Verify chain integrity
node packages/cli/dist/index.js verify packages/cli/demo-traces.json --verbose

# Inspect session timeline
node packages/cli/dist/index.js inspect packages/cli/demo-traces.json

# Export compliance report
node packages/cli/dist/index.js export packages/cli/demo-traces.json --standard ISO_42001 --output report.json

# Generate signing keypair
node packages/cli/dist/index.js keygen
```

---

## 📦 SDK Usage

### TypeScript

```typescript
import { AgentTraceClient } from '@yfwdecimal/sdk';

const client = new AgentTraceClient({
  endpoint: 'http://localhost:4000',
  agentId: 'research-agent-v2',
  projectId: 'my-project',
});

// Auto-signed, hash-chained spans
const span = client.startSpan('GPT-4 Inference', 'llm_call');
span.setInput({ model: 'gpt-4', prompt: 'Analyze this data...' });
span.setOutput({ tokens: 342, response: '...' });
span.end();

await client.flush();
```

### LangChain Integration

```typescript
import { AgentTraceCallbackHandler } from '@yfwdecimal/sdk/adapters/langchain';

const handler = new AgentTraceCallbackHandler(client);
const agent = new AgentExecutor({ callbacks: [handler] });
// All LLM calls, tool invocations, and chain runs are auto-traced
```

### Python

```python
from agenttrace import AgentTraceClient

client = AgentTraceClient(
    endpoint="http://localhost:4000",
    agent_id="research-agent-v2"
)

with client.trace("GPT-4 Inference", kind="llm_call") as span:
    span.set_input({"model": "gpt-4", "prompt": "..."})
    result = call_llm(...)
    span.set_output({"response": result})
# Auto-signed with Ed25519, hash-chained to previous record
```

---

## 🛡️ Cryptographic Guarantees

| Property | Implementation | Standard |
|----------|---------------|----------|
| **Content Integrity** | SHA-256 content hash per record | FIPS 180-4 |
| **Chain Integrity** | Each hash includes previous hash | Blockchain-style |
| **Non-Repudiation** | Ed25519 signature per record | RFC 8032 |
| **Batch Integrity** | Merkle tree root over all hashes | RFC 6962 |
| **Tamper Detection** | Hash mismatch + chain break detection | Automated |

---

## 📋 Compliance Standards

AgentTrace generates evidence packages for:

| Standard | Section | Coverage |
|----------|---------|----------|
| **ISO/IEC 42001:2023** | A.6.2.8 | AI decision audit trail |
| **ISO/IEC 27001:2022** | A.8.15 | Event logging controls |
| **NIST AI RMF 1.0** | MG-3.2 | Risk measurement |
| **SOC 2 Type II** | PI1 | Processing integrity |

---

## 🧪 Test Coverage

```
@yfwdecimal/core     24 tests ✓  (hash chain, Merkle, Ed25519, serializer)
@yfwdecimal/sdk      16 tests ✓  (client, spans, adapters, transport)
python-sdk           10 tests ✓  (crypto, client, context manager)
─────────────────────────────────
Total                50 tests ✓
```

---

## 📁 Project Structure

```
agenttrace/
├── packages/
│   ├── core/           # Cryptographic engine
│   ├── sdk/            # TypeScript SDK + adapters
│   ├── cli/            # Forensic audit CLI
│   └── python-sdk/     # Python SDK
├── apps/
│   ├── api/            # Fastify append-only API
│   └── dashboard/      # Next.js 15 compliance dashboard
├── turbo.json          # Turborepo pipeline
└── pnpm-workspace.yaml # Monorepo config
```

---

## 🔑 Key Design Decisions

1. **Append-only architecture** — Records can never be modified or deleted
2. **Zero-dependency CLI** — Only uses Node.js built-ins + `@yfwdecimal/core`
3. **Cross-language parity** — TypeScript and Python SDKs produce identical cryptographic output
4. **ESM-first** — All packages use ES modules (`"type": "module"`)
5. **Monorepo with Turborepo** — Parallel builds, dependency-aware caching

---

<p align="center">
  <sub>Built for production. Designed for compliance. Ready for audit.</sub>
</p>
