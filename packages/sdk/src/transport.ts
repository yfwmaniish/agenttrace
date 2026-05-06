/**
 * HTTP Transport — sends trace records to the AgentTrace API server
 *
 * Features:
 * - Batched sending (configurable batch size)
 * - Automatic retry with exponential backoff
 * - Queue-based buffering
 */

import type { TraceRecord } from '@yfwdecimal/core';
import type { Transport } from './types.js';

export class HttpTransport implements Transport {
  private queue: { records: TraceRecord[]; sessionId: string; projectId: string }[] = [];
  private sending = false;

  constructor(
    private readonly endpoint: string,
    private readonly apiKey?: string,
    private readonly maxRetries = 3,
  ) {}

  async send(records: TraceRecord[], sessionId: string, projectId: string): Promise<void> {
    this.queue.push({ records, sessionId, projectId });
    if (!this.sending) {
      await this.processQueue();
    }
  }

  async flush(): Promise<void> {
    await this.processQueue();
  }

  private async processQueue(): Promise<void> {
    this.sending = true;
    try {
      while (this.queue.length > 0) {
        const batch = this.queue.shift()!;
        await this.sendBatch(batch.records, batch.sessionId, batch.projectId);
      }
    } finally {
      this.sending = false;
    }
  }

  private async sendBatch(
    records: TraceRecord[],
    sessionId: string,
    projectId: string,
    attempt = 0,
  ): Promise<void> {
    try {
      const resp = await fetch(`${this.endpoint}/traces`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {}),
        },
        body: JSON.stringify({ sessionId, projectId, records }),
      });

      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status}: ${await resp.text()}`);
      }
    } catch (err) {
      if (attempt < this.maxRetries) {
        const delay = Math.min(1000 * 2 ** attempt, 10000);
        await new Promise((r) => setTimeout(r, delay));
        return this.sendBatch(records, sessionId, projectId, attempt + 1);
      }
      console.error(`[AgentTrace] Failed to send ${records.length} records after ${this.maxRetries} retries:`, err);
      throw err;
    }
  }
}

/** No-op transport for offline/testing usage */
export class NoopTransport implements Transport {
  async send(): Promise<void> {}
  async flush(): Promise<void> {}
}
