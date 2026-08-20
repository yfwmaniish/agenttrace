# AgentTrace

AgentTrace is a forensic audit system for AI agents. It wraps agent execution — LLM calls, tool invocations, chain runs, retrievals — in cryptographically signed, hash-chained records, so that after the fact you can prove what an agent did, in what order, and whether any of the log was altered.

## Why this exists

AI agents increasingly make decisions with real consequences (approving a transaction, executing a trade, writing to a database, deploying code), but most agent logging today is a mutable JSON blob or a database row that anyone with write access can edit after the fact. That's fine for debugging, but it isn't evidence. AgentTrace treats every agent action as a record in an append-only, blockchain-style hash chain: each record's hash depends on the one before it and is signed with an Ed25519 key, so a single edited field breaks every hash after it. The project also generates structured evidence exports mapped to specific clauses of AI/security compliance frameworks (ISO/IEC 42001, ISO/IEC 27001, NIST AI RMF), aimed at teams that need to show an auditor "here is what the agent did and here is the cryptographic proof it wasn't tampered with."

This is a personal/academic monorepo project (crypto engine, TypeScript and Python SDKs, a REST API, a compliance dashboard, and a CLI), not a hosted commercial product.

## How the chain works

The core design lives in `packages/core/src`:

- **Content hash** — each `Span` (one agent action: an LLM call, tool call, retrieval, etc.) is canonicalized to deterministic JSON (`serializer.ts`, sorted keys, UTC timestamps) and hashed with SHA-256 (`computeContentHash`).
- **Chain hash** — `chainHash = SHA-256(contentHash + previousRecord.chainHash)`. The very first record in a chain links to a genesis hash (64 zero characters). This is what makes the chain tamper-evident: changing any record's content changes its content hash, which changes its chain hash, which breaks every subsequent record's `previousHash` reference.
- **Signature** — every record's `chainHash` is signed with Ed25519 (`signer.ts`, via Node's native `crypto` module), giving non-repudiation independent of the chain integrity check.
- **Merkle tree** — `merkle.ts` can roll a batch of chain hashes into a single Merkle root, with inclusion-proof generation/verification, for anchoring or compact batch verification.
- **Verification** — `verifier.ts` re-derives every record's content hash, chain hash, and signature and reports exactly where a chain breaks (`hash_mismatch`, `signature_invalid`, `chain_break`, `sequence_gap`), including which record was the first to be tampered with (`findTamperPoint`).

None of this is blockchain in the distributed-ledger sense — there's no consensus or peer network. It's a local, cryptographically verifiable append-only log, backed by a Postgres database that the API treats as append-only at the application layer (there is no DB-level immutability enforcement such as row-level security or triggers preventing updates/deletes — that's a known limitation, not yet implemented).

## What's actually implemented

- **Crypto engine** (`packages/core`) — SHA-256 hash chaining, Ed25519 signing/verification, Merkle tree construction and inclusion proofs, deterministic canonical JSON serialization, full chain verification with tamper localization. Covered by 24 Vitest tests.
- **TypeScript SDK** (`packages/sdk`) — `AgentTraceClient` for starting/ending spans, an in-process hash chain, a batching HTTP transport with retry/backoff (and a no-op transport for offline use), a generic adapter, and a LangChain-shaped callback handler (`AgentTraceCallbackHandler` / `LangChainAdapter`) that hooks LLM/chain/tool/agent callback events without importing LangChain itself. 16 Vitest tests.
- **Python SDK** (`packages/python-sdk`) — a parallel client (`AgentTraceClient`) with the same hash-chain/Ed25519 design (via the `cryptography` package), a context-manager span API (`with client.trace(...) as span:`), sync/async flush over `httpx`, and a LangChain integration module. 10 pytest tests. Published under the `agenttrace` name on PyPI-style packaging (`pyproject.toml`).
- **API server** (`apps/api`) — a Fastify service backed by Prisma 7 + PostgreSQL (via `@prisma/adapter-pg`). Routes: `POST /api/projects` (creates a project, API key, and Ed25519 keypair), `POST /api/traces` (append-only ingestion), `GET /api/traces/:sessionId`, `GET /api/sessions`, `POST /api/verify` and `POST /api/verify/tamper-point` (chain verification), `GET /api/export/:sessionId` (compliance evidence export), `GET /api/health`. Note: an API key is issued per project on creation, but the ingestion/verify/export routes do not currently check it against the database — request authentication is not yet enforced.
- **Dashboard** (`apps/dashboard`) — a Next.js 15 / React 19 app with pages for an overview (live hash-chain visualization, session list, activity feed), session browsing, chain verification, and compliance export, styled with Tailwind CSS. It talks to the API via `src/lib/api.ts`. The compliance-standards widget on the overview page currently displays a static/hardcoded status table rather than deriving compliance state from real evidence data.
- **CLI** (`packages/cli`, `@yfwdecimal/cli`, binary name `agenttrace`) — zero-dependency Node CLI with `verify` (chain verification against a local JSON trace file, table or JSON output), `inspect`, `export` (generates an ISO 42001 / ISO 27001 / NIST AI RMF / SOC 2 style evidence report from a trace file), `keygen` (Ed25519 keypair generation), and `status`.
- **Demo scripts** (`demo/`) — `live-demo.mjs` runs an end-to-end scripted walkthrough (generate keypair, record a simulated agent session, verify, tamper with a record, detect the tamper, export a report) directly against the built `packages/core` output; `python-demo.py` is the Python equivalent.

## Compliance mappings referenced in the export/CLI/dashboard code

| Standard | Section referenced in code |
|---|---|
| ISO/IEC 42001:2023 | A.6.2.8 |
| ISO/IEC 27001:2022 | A.8.15 |
| NIST AI RMF 1.0 | MG-3.2 |
| SOC 2 Type II | PI1 |

These are the clause references the export logic attaches to each evidence package (`packages/cli/src/commands/export.ts`, `apps/api/src/routes/export.ts`). AgentTrace produces the cryptographic evidence artifact (hash chain, Merkle root, verification result) mapped to these clauses — it does not perform a compliance audit itself.

## Tech stack

- **Language:** TypeScript (strict, ES2022, ESM throughout) and Python (3.9+)
- **Monorepo:** pnpm workspaces + Turborepo
- **Crypto:** Node.js native `crypto` (Ed25519, SHA-256) on the TS side; the `cryptography` package on the Python side
- **API:** Fastify 5, Prisma 7 (`@prisma/adapter-pg`), PostgreSQL, Zod
- **Dashboard:** Next.js 15, React 19, Tailwind CSS 4
- **CLI:** Node.js built-ins only (`node:util`'s `parseArgs`), no external CLI framework
- **Testing:** Vitest (TypeScript packages), pytest (Python SDK)
- **Deployment config present in repo:** a multi-stage `Dockerfile` for the API, `render.yaml` (Render.com), and `apps/api/vercel.json` (Vercel serverless) — these are configuration for deploying the API, not evidence of a live hosted instance

## Project structure

```
agenttrace/
├── packages/
│   ├── core/           # Crypto engine: hash chain, Ed25519, Merkle tree, verifier
│   ├── sdk/             # TypeScript SDK + LangChain/generic adapters
│   ├── cli/             # agenttrace CLI (verify, inspect, export, keygen, status)
│   └── python-sdk/      # Python SDK (client, crypto, span, langchain integration)
├── apps/
│   ├── api/              # Fastify + Prisma + PostgreSQL append-only API
│   └── dashboard/        # Next.js compliance dashboard
├── demo/                 # Scripted end-to-end demos (Node + Python)
├── docs/                 # Design/redesign notes
├── turbo.json             # Turborepo pipeline
└── pnpm-workspace.yaml     # Monorepo package list
```

## Getting started

### Prerequisites

- Node.js >= 18
- pnpm >= 9
- Python >= 3.9 (only needed for the Python SDK)
- PostgreSQL (only needed to run the API server)

### Install and build

```bash
git clone https://github.com/yfwmaniish/agenttrace.git
cd agenttrace
pnpm install
pnpm build
```

### Run the tests

```bash
# TypeScript packages (core + sdk)
pnpm test

# Python SDK
cd packages/python-sdk
pip install -e ".[dev]"
pytest tests/
```

### Run the API server

```bash
cd apps/api
# set DATABASE_URL in a .env file (PostgreSQL connection string)
pnpm db:generate
pnpm db:migrate
pnpm dev            # tsx watch, http://localhost:3001
```

### Run the dashboard

```bash
cd apps/dashboard
npm run dev
# http://localhost:3000
```

### Try the CLI

```bash
# Generate a demo trace file
node packages/cli/scripts/gen-demo.mjs

# Verify chain integrity
node packages/cli/dist/index.js verify packages/cli/demo-traces.json --verbose

# Inspect a session timeline
node packages/cli/dist/index.js inspect packages/cli/demo-traces.json

# Export a compliance report
node packages/cli/dist/index.js export packages/cli/demo-traces.json --standard ISO_42001 --output report.json

# Generate an Ed25519 signing keypair
node packages/cli/dist/index.js keygen
```

### Run the scripted demo

```bash
pnpm --filter @yfwdecimal/core build
node demo/live-demo.mjs
```

## SDK usage

### TypeScript

```typescript
import { AgentTraceClient } from '@yfwdecimal/sdk';

const client = new AgentTraceClient({
  endpoint: 'http://localhost:3001/api',
  projectId: 'my-project',
});

const span = client.startSpan('GPT-4 Inference', { kind: 'llm_call' });
span.setInput({ model: 'gpt-4', prompt: 'Analyze this data...' });
span.setOutput({ tokens: 342, response: '...' });
span.end(); // signed and hash-chained locally

await client.flush(); // sent to the API
```

### LangChain (TypeScript)

```typescript
import { AgentTraceClient } from '@yfwdecimal/sdk';
import { LangChainAdapter } from '@yfwdecimal/sdk/adapters/langchain';

const client = new AgentTraceClient({ endpoint: 'http://localhost:3001/api' });
const handler = new LangChainAdapter(client);
// pass `handler` as a LangChain callback to auto-trace LLM/chain/tool/agent events
```

### Python

```python
from agenttrace import AgentTraceClient

client = AgentTraceClient(endpoint="http://localhost:3001/api", project_id="my-project")

with client.trace("GPT-4 Inference", kind="llm_call") as span:
    span.set_input({"model": "gpt-4", "prompt": "..."})
    result = call_llm(...)
    span.set_output({"response": result})
# signed with Ed25519 and hash-chained to the previous record on exit

client.flush_sync()
```

## Notable technical decisions

1. **Append-only by convention, not by database guarantee.** The API only ever inserts trace records; nothing in the current code deletes or updates them. This is enforced by the application logic, not by database-level constraints (no RLS policies or triggers), which is worth being explicit about if this is ever used for real evidentiary purposes.
2. **Cross-language cryptographic parity.** The TypeScript and Python SDKs implement the same hash-chain construction (`SHA-256(contentHash + previousHash)`) and the same Ed25519 signing scheme so that records produced by either SDK verify identically.
3. **Zero-dependency CLI.** The CLI uses only Node's built-in `node:util` `parseArgs` and the workspace `@yfwdecimal/core` package — no Commander.js or similar framework.
4. **ESM-first.** All TypeScript packages are `"type": "module"`.
5. **Monorepo with Turborepo + pnpm workspaces** for dependency-aware, cached builds across `packages/*` and `apps/*`.
6. **Fastify + Prisma 7 with the `@prisma/adapter-pg` driver adapter** rather than Prisma's default query engine binary, and Zod for request validation.

## Known gaps / not yet implemented

- API key authentication is generated per project but not currently checked on the ingestion, verification, or export endpoints.
- The dashboard's compliance-standards panel shows static example data rather than being derived live from verification results.
- No CI configuration is present in the repository.
- Merkle root anchoring to an external system (e.g., a Git commit or timestamping authority, as referenced in the core module's docstring) is not implemented — only local Merkle root computation and inclusion proofs are.

## License

MIT — see [LICENSE](LICENSE).
