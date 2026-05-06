# AgentTrace — Codebase Map

> Cryptographic forensic audit system for AI agents.
> **Category:** SIEM/forensics for agents (NOT observability/APM)

## OS
Windows

## Stack
- **Monorepo:** pnpm workspaces + Turborepo
- **Language:** TypeScript (strict, ES2022)
- **Crypto:** Ed25519 + SHA-256 hash chains + Merkle trees (Node.js native `crypto`)
- **API:** Fastify + Prisma 7 (PrismaPg adapter) + PostgreSQL
- **Dashboard:** Next.js 15 (planned)
- **CLI:** Commander.js (planned)
- **Python SDK:** Planned alongside TS SDK
- **Testing:** Vitest

## Packages

| Package | Path | Status | Purpose |
|---------|------|--------|---------|
| `@yfwdecimal/core` | `packages/core/` | ✅ Done (24 tests) | Crypto engine |
| `@yfwdecimal/sdk` | `packages/sdk/` | 🔲 Planned | Agent instrumentation |
| `@yfwdecimal/cli` | `packages/cli/` | 🔲 Planned | Developer CLI |
| `@yfwdecimal/api` | `apps/api/` | ✅ Scaffolded | REST API server |
| `apps/dashboard` | `apps/dashboard/` | 🔲 Planned | Compliance dashboard |

## Key Files

### Core Crypto Engine (`packages/core/src/`)
- `types.ts` — Data model (Span, TraceRecord, VerificationResult, MerkleProof, ComplianceExport)
- `signer.ts` — Ed25519 keypair generation, sign/verify
- `hash-chain.ts` — SHA-256 hash chaining, `HashChain` class, `createTraceRecord()`
- `merkle.ts` — Merkle tree build, `computeMerkleRoot()`, inclusion proofs
- `verifier.ts` — `verifyChain()`, `findTamperPoint()`, 5-point verification
- `serializer.ts` — Deterministic canonical JSON (sorted keys, UTC dates)
- `index.ts` — Public API re-exports

### API Server (`apps/api/src/`)
- `index.ts` — Fastify bootstrap
- `db/client.ts` — Prisma 7 singleton (PrismaPg adapter)
- `routes/health.ts` — GET /api/health
- `routes/projects.ts` — POST/GET /api/projects (keypair + API key generation)
- `routes/traces.ts` — POST /api/traces (append-only ingestion), GET /api/traces/:sessionId
- `routes/verify.ts` — POST /api/verify (chain verification), POST /api/verify/tamper-point
- `routes/export.ts` — GET /api/export/:sessionId (ISO 42001/27001 compliance export)

### Database (`apps/api/prisma/`)
- `schema.prisma` — 5 tables: projects, api_keys, sessions, trace_records, merkle_roots
- `prisma.config.ts` — Prisma 7 config (datasource URL)

### Tests
- `packages/core/__tests__/core.test.ts` — 24 tests covering all crypto modules

## Architecture Decisions
- **ADR-1:** Full TypeScript monorepo (max code sharing for sprint)
- **ADR-2:** Ed25519 + SHA-256 (FIPS 180-4, auditor-recognizable)
- **ADR-3:** Append-only PostgreSQL via RLS (not blockchain)
- **ADR-4:** Fastify over Express (faster, schema validation built-in)

## Competitive Position
- Zero of 25+ tools provide cryptographically signed traces
- 7 indie competitors (IRL Engine, SpanForge, Trace Prompt, etc.) — none have compliance UX
- **Real wedge:** Crypto is table stakes. Compliance workflow IS the product.

## Progress
- [x] Phase 1: Foundation (monorepo, crypto engine, API scaffold)
- [ ] Phase 2: SDK (TS + Python)
- [ ] Phase 3: Dashboard (Next.js)
- [ ] Phase 4: CLI
- [ ] Phase 5: Demo + Polish
