/**
 * LangChain Adapter — AgentTraceCallbackHandler
 *
 * Integrates with LangChain's callback system to automatically
 * trace LLM calls, tool invocations, chain runs, and agent steps.
 *
 * Usage:
 *   import { AgentTraceClient } from '@yfwdecimal/sdk';
 *   import { LangChainAdapter } from '@yfwdecimal/sdk/adapters';
 *
 *   const client = new AgentTraceClient({ ... });
 *   const handler = new LangChainAdapter(client);
 *   const agent = new AgentExecutor({ callbacks: [handler] });
 */

import { AgentTraceClient } from '../client.js';
import { TracingSpan } from '../span.js';

/**
 * LangChain-compatible callback handler that produces signed trace records.
 * Implements the BaseCallbackHandler interface shape without importing langchain.
 */
export class LangChainAdapter {
  readonly name = 'AgentTraceCallbackHandler';
  private spanStack: Map<string, TracingSpan> = new Map();

  constructor(private readonly client: AgentTraceClient) {}

  // --- LLM Callbacks ---

  handleLLMStart(llm: { name?: string }, prompts: string[], runId: string, parentRunId?: string) {
    const span = this.client.startSpan(llm.name ?? 'llm_call', {
      kind: 'llm_call',
      parentSpanId: parentRunId ? this.spanStack.get(parentRunId)?.spanId : undefined,
    });
    span.setInput({ prompts });
    span.setAttribute('llm.name', llm.name);
    this.spanStack.set(runId, span);
  }

  handleLLMEnd(output: { generations?: unknown; llmOutput?: unknown }, runId: string) {
    const span = this.spanStack.get(runId);
    if (!span) return;
    span.setOutput(output);
    span.addEvent('llm_complete');
    span.end();
    this.spanStack.delete(runId);
  }

  handleLLMError(error: Error, runId: string) {
    const span = this.spanStack.get(runId);
    if (!span) return;
    span.setError(error);
    span.end();
    this.spanStack.delete(runId);
  }

  // --- Chain Callbacks ---

  handleChainStart(chain: { name?: string }, inputs: unknown, runId: string, parentRunId?: string) {
    const span = this.client.startSpan(chain.name ?? 'chain_run', {
      kind: 'chain_run',
      parentSpanId: parentRunId ? this.spanStack.get(parentRunId)?.spanId : undefined,
    });
    span.setInput(inputs);
    this.spanStack.set(runId, span);
  }

  handleChainEnd(outputs: unknown, runId: string) {
    const span = this.spanStack.get(runId);
    if (!span) return;
    span.setOutput(outputs);
    span.end();
    this.spanStack.delete(runId);
  }

  handleChainError(error: Error, runId: string) {
    const span = this.spanStack.get(runId);
    if (!span) return;
    span.setError(error);
    span.end();
    this.spanStack.delete(runId);
  }

  // --- Tool Callbacks ---

  handleToolStart(tool: { name?: string }, input: string, runId: string, parentRunId?: string) {
    const span = this.client.startSpan(tool.name ?? 'tool_invoke', {
      kind: 'tool_invoke',
      parentSpanId: parentRunId ? this.spanStack.get(parentRunId)?.spanId : undefined,
    });
    span.setInput(input);
    span.setAttribute('tool.name', tool.name);
    this.spanStack.set(runId, span);
  }

  handleToolEnd(output: string, runId: string) {
    const span = this.spanStack.get(runId);
    if (!span) return;
    span.setOutput(output);
    span.end();
    this.spanStack.delete(runId);
  }

  handleToolError(error: Error, runId: string) {
    const span = this.spanStack.get(runId);
    if (!span) return;
    span.setError(error);
    span.end();
    this.spanStack.delete(runId);
  }

  // --- Agent Callbacks ---

  handleAgentAction(action: { tool: string; toolInput: unknown; log: string }, runId: string) {
    const span = this.spanStack.get(runId);
    if (!span) return;
    span.addEvent('agent_action', { tool: action.tool, input: action.toolInput });
  }

  handleAgentEnd(output: { returnValues: unknown; log: string }, runId: string) {
    const span = this.spanStack.get(runId);
    if (!span) return;
    span.addEvent('agent_finish', { output: output.returnValues });
  }
}
