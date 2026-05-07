from typing import Any, Dict, List, Optional, Union
from uuid import UUID

from langchain_core.callbacks import BaseCallbackHandler
from langchain_core.outputs import LLMResult

from agenttrace.client import AgentTraceClient
from agenttrace.span import TracingSpan


class AgentTraceCallbackHandler(BaseCallbackHandler):
    """
    LangChain Callback Handler that automatically signs and pushes traces to AgentTrace.
    """

    def __init__(self, client: AgentTraceClient):
        self.client = client
        self._spans: Dict[UUID, TracingSpan] = {}

    def on_llm_start(
        self, serialized: Dict[str, Any], prompts: List[str], *, run_id: UUID, **kwargs: Any
    ) -> Any:
        span = self.client.start_span(
            name=serialized.get("name", "LLM Call"),
            kind="llm_call"
        )
        span.set_input({"prompts": prompts})
        self._spans[run_id] = span

    def on_llm_end(self, response: LLMResult, *, run_id: UUID, **kwargs: Any) -> Any:
        span = self._spans.pop(run_id, None)
        if span:
            span.set_output(response.json())
            span.end()

    def on_chain_start(
        self, serialized: Dict[str, Any], inputs: Dict[str, Any], *, run_id: UUID, **kwargs: Any
    ) -> Any:
        span = self.client.start_span(
            name=serialized.get("name", "Chain Step"),
            kind="agent_step"
        )
        span.set_input(inputs)
        self._spans[run_id] = span

    def on_chain_end(self, outputs: Dict[str, Any], *, run_id: UUID, **kwargs: Any) -> Any:
        span = self._spans.pop(run_id, None)
        if span:
            span.set_output(outputs)
            span.end()

    def on_tool_start(
        self, serialized: Dict[str, Any], input_str: str, *, run_id: UUID, **kwargs: Any
    ) -> Any:
        span = self.client.start_span(
            name=serialized.get("name", "Tool Invoke"),
            kind="tool_invoke"
        )
        span.set_input(input_str)
        self._spans[run_id] = span

    def on_tool_end(self, output: str, *, run_id: UUID, **kwargs: Any) -> Any:
        span = self._spans.pop(run_id, None)
        if span:
            span.set_output(output)
            span.end()

    def on_llm_error(self, error: Union[Exception, KeyboardInterrupt], *, run_id: UUID, **kwargs: Any) -> Any:
        span = self._spans.pop(run_id, None)
        if span:
            span.set_error(error)
            span.end()

    def on_chain_error(self, error: Union[Exception, KeyboardInterrupt], *, run_id: UUID, **kwargs: Any) -> Any:
        span = self._spans.pop(run_id, None)
        if span:
            span.set_error(error)
            span.end()

    def on_tool_error(self, error: Union[Exception, KeyboardInterrupt], *, run_id: UUID, **kwargs: Any) -> Any:
        span = self._spans.pop(run_id, None)
        if span:
            span.set_error(error)
            span.end()
