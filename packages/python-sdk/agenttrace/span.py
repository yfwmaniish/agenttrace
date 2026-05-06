"""TracingSpan — mutable span for tracking agent actions."""

import uuid
from datetime import datetime, timezone
from typing import Any


class TracingSpan:
    def __init__(self, name: str, trace_id: str, session_id: str, kind: str = "custom",
                 parent_span_id: str | None = None, on_end=None):
        self.span_id = str(uuid.uuid4())
        self.trace_id = trace_id
        self.session_id = session_id
        self.parent_span_id = parent_span_id
        self.name = name
        self.kind = kind
        self.start_time = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
        self._end_time: str | None = None
        self._status = "running"
        self._attributes: dict[str, Any] = {}
        self._events: list[dict] = []
        self._input: Any = None
        self._output: Any = None
        self._on_end = on_end

    def set_input(self, data: Any) -> "TracingSpan":
        self._input = data
        return self

    def set_output(self, data: Any) -> "TracingSpan":
        self._output = data
        return self

    def set_attribute(self, key: str, value: Any) -> "TracingSpan":
        self._attributes[key] = value
        return self

    def add_event(self, name: str, attributes: dict | None = None) -> "TracingSpan":
        self._events.append({
            "name": name,
            "timestamp": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
            "attributes": attributes,
        })
        return self

    def set_error(self, error: Exception | str) -> "TracingSpan":
        self._status = "error"
        self._attributes["error"] = str(error)
        return self

    def end(self):
        if self._end_time:
            return
        self._end_time = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
        if self._status == "running":
            self._status = "completed"
        if self._on_end:
            self._on_end(self)

    def to_dict(self) -> dict:
        return {
            "spanId": self.span_id,
            "traceId": self.trace_id,
            "parentSpanId": self.parent_span_id,
            "sessionId": self.session_id,
            "name": self.name,
            "kind": self.kind,
            "startTime": self.start_time,
            "endTime": self._end_time,
            "status": self._status,
            "attributes": self._attributes,
            "events": self._events,
            "input": self._input,
            "output": self._output,
        }

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        if exc_val:
            self.set_error(exc_val)
        self.end()
        return False
