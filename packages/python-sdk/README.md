# AgentTrace (Python SDK)

Cryptographic forensic audit SDK for AI agents — Ed25519 signing, SHA-256 hash chains, and real-time tamper detection.

## Features

- **Ed25519 Signatures** — Every trace record is cryptographically signed locally (non-repudiation).
- **SHA-256 Hash Chains** — Immutable linked records detect any deletion or reordering.
- **Context Manager API** — Pythonic `with` syntax for effortless tracing.
- **LangChain "Drop-in" Integration** — One-line forensic enablement for LangChain agents.
- **Cross-Language Parity** — Identical cryptographic primitives as the TypeScript SDK.

## Install

```bash
pip install agenttrace
```

## Quick Start

```python
from agenttrace.client import AgentTraceClient

# 1. Initialize the Forensic Client
client = AgentTraceClient(
    endpoint="https://api-puce-zeta.vercel.app/api", 
    api_key="at_...",
    project_id="AI Research Lab"
)

# 2. Pythonic context manager auto-signs and hash-chains
with client.trace("GPT-4 Inference", kind="llm_call") as span:
    span.set_input({"model": "gpt-4", "prompt": "Analyze quarterly earnings"})
    # result = call_llm(...)
    span.set_output({"tokens": 342, "response": "Bullish trend detected."})

# 3. Flush signatures to the AgentTrace Cloud
client.flush_sync()
```

## LangChain Integration (The Wedge)

Enable forensics for any LangChain agent by simply adding our callback handler.

```python
from agenttrace.langchain import AgentTraceCallbackHandler

# 1. Setup the handler
trace_handler = AgentTraceCallbackHandler(client)

# 2. Add to any agent run
agent_executor.run(
    "Perform a market analysis on NVIDIA.", 
    callbacks=[trace_handler]
)

# All LLM calls and tool invocations are now cryptographically signed.
```

## Cryptographic Standards

| Property | Standard |
|----------|----------|
| Content hashing | SHA-256 (FIPS 180-4) |
| Digital signatures | Ed25519 (RFC 8032) |
| Chain integrity | Hash(content ‖ previous_hash) |

## Forensic Verification
You can verify any session by its ID using the AgentTrace Dashboard or the CLI:

```bash
# Verify a session locally
npx @agenttrace/cli verify <session-id>
```

## License
MIT
