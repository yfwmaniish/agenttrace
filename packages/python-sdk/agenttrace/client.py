"""AgentTrace Python Client — main SDK entry point."""

import uuid
from typing import Any

from agenttrace.crypto import generate_keypair, create_trace_record, GENESIS_HASH, compute_merkle_root
from agenttrace.span import TracingSpan


class AgentTraceClient:
    """
    Python SDK client for AgentTrace.

    Usage:
        client = AgentTraceClient(api_key="at_xxx", endpoint="http://localhost:3001/api")

        with client.trace("llm_call", kind="llm_call") as span:
            span.set_input({"prompt": "Hello"})
            result = call_llm("Hello")
            span.set_output(result)

        # Or manual:
        span = client.start_span("tool_call", kind="tool_invoke")
        span.set_input({"tool": "search"})
        span.end()
    """

    def __init__(self, api_key: str | None = None, endpoint: str | None = None,
                 project_id: str = "default", key_pair: dict | None = None):
        self.key_pair = key_pair or generate_keypair()
        self.project_id = project_id
        self.session_id = str(uuid.uuid4())
        self.api_key = api_key
        self.endpoint = endpoint

        self._records: list[dict] = []
        self._last_hash = GENESIS_HASH
        self._sequence = 0
        self._buffer: list[dict] = []

    def start_span(self, name: str, kind: str = "custom", parent_span_id: str | None = None) -> TracingSpan:
        trace_id = str(uuid.uuid4())
        span = TracingSpan(name, trace_id, self.session_id, kind=kind,
                          parent_span_id=parent_span_id, on_end=self._on_span_end)
        return span

    def trace(self, name: str, kind: str = "custom") -> TracingSpan:
        """Create a span as a context manager: `with client.trace(...) as span:`"""
        return self.start_span(name, kind=kind)

    def _on_span_end(self, span: TracingSpan):
        record = create_trace_record(
            span.to_dict(), self._last_hash, self._sequence,
            self.key_pair["privateKey"], self.key_pair["publicKey"],
        )
        self._records.append(record)
        self._buffer.append(record)
        self._last_hash = record["chainHash"]
        self._sequence += 1

    async def flush(self):
        """Send buffered records to the AgentTrace API."""
        if not self._buffer or not self.endpoint:
            return
        import httpx
        async with httpx.AsyncClient() as http:
            headers = {"Content-Type": "application/json"}
            if self.api_key:
                headers["Authorization"] = f"Bearer {self.api_key}"
            await http.post(f"{self.endpoint}/traces", json={
                "sessionId": self.session_id,
                "projectId": self.project_id,
                "records": self._buffer,
            }, headers=headers)
        self._buffer.clear()

    def get_records(self) -> list[dict]:
        return list(self._records)

    def get_merkle_root(self) -> str:
        return compute_merkle_root([r["chainHash"] for r in self._records])

    @property
    def chain_length(self) -> int:
        return len(self._records)
