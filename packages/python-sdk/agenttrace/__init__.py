"""
AgentTrace Python SDK — Cryptographic forensic audit for AI agents.

Usage:
    from agenttrace import AgentTraceClient

    client = AgentTraceClient(api_key="at_xxx", endpoint="http://localhost:3001/api")

    with client.trace("llm_call", kind="llm_call") as span:
        span.set_input({"prompt": "Hello"})
        result = call_my_llm("Hello")
        span.set_output({"response": result})

    await client.flush()
"""

from agenttrace.client import AgentTraceClient
from agenttrace.span import TracingSpan
from agenttrace.crypto import generate_keypair, verify_chain, find_tamper_point

__version__ = "0.1.0"
__all__ = ["AgentTraceClient", "TracingSpan", "generate_keypair", "verify_chain", "find_tamper_point"]
