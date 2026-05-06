# agenttrace (Python)

Cryptographic forensic audit SDK for AI agents — Ed25519 signing, SHA-256 hash chains, tamper detection.

## Features

- **Ed25519 Signatures** — Every trace record is cryptographically signed
- **SHA-256 Hash Chains** — Tamper-proof linked records
- **Context Manager API** — Pythonic `with` syntax for tracing
- **Async HTTP Transport** — Non-blocking trace delivery via `httpx`
- **LangChain Compatible** — Optional adapter for LangChain agents
- **Cross-Language Parity** — Identical crypto output as the TypeScript SDK

## Install

```bash
pip install agenttrace
```

## Quick Start

```python
from agenttrace import AgentTraceClient

client = AgentTraceClient(
    endpoint="http://localhost:4000",
    agent_id="research-agent-v2"
)

# Context manager auto-signs and chains
with client.trace("GPT-4 Inference", kind="llm_call") as span:
    span.set_input({"model": "gpt-4", "prompt": "Analyze quarterly earnings"})
    result = call_llm(...)
    span.set_output({"tokens": 342, "response": result})

# Explicit flush
await client.flush()
```

## Standalone Crypto

```python
from agenttrace.crypto import generate_keypair, sign_message, verify_signature
import hashlib

# Generate Ed25519 keypair
private_key, public_key = generate_keypair()

# Sign data
message = b"critical agent decision"
signature = sign_message(private_key, message)

# Verify
is_valid = verify_signature(public_key, message, signature)
assert is_valid
```

## LangChain Integration

```bash
pip install agenttrace[langchain]
```

```python
from agenttrace.adapters.langchain import AgentTraceCallbackHandler

handler = AgentTraceCallbackHandler(client)
agent = AgentExecutor(callbacks=[handler])
# All LLM calls auto-traced with forensic signatures
```

## Cryptographic Standards

| Property | Standard |
|----------|----------|
| Content hashing | SHA-256 (FIPS 180-4) |
| Digital signatures | Ed25519 (RFC 8032) |
| Chain integrity | Hash(content ‖ previous_hash) |

## License

MIT
