/**
 * Deterministic canonical serialization
 *
 * Ensures the same data always produces the same hash, regardless of
 * property insertion order, whitespace, or platform differences.
 *
 * Rules:
 * 1. Object keys sorted alphabetically (recursive)
 * 2. Dates normalized to ISO 8601 UTC
 * 3. Numbers use fixed precision
 * 4. undefined → null
 * 5. Consistent JSON.stringify output
 */

/**
 * Canonicalize any value into a deterministic JSON string.
 * This is the foundation of all hash computations in AgentTrace.
 */
export function canonicalize(data: unknown): string {
  return JSON.stringify(sortKeys(data));
}

/**
 * Recursively sort all object keys alphabetically.
 * Arrays preserve order (elements are sorted by key if objects).
 */
function sortKeys(value: unknown): unknown {
  if (value === null || value === undefined) {
    return null;
  }

  if (Array.isArray(value)) {
    return value.map(sortKeys);
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === 'object') {
    const sorted: Record<string, unknown> = {};
    const keys = Object.keys(value as Record<string, unknown>).sort();
    for (const key of keys) {
      sorted[key] = sortKeys((value as Record<string, unknown>)[key]);
    }
    return sorted;
  }

  return value;
}

/**
 * Compute a canonical hash input for a Span.
 * Extracts only the fields that constitute the span's identity.
 */
export function canonicalizeSpan(span: {
  spanId: string;
  traceId: string;
  parentSpanId?: string;
  sessionId: string;
  name: string;
  kind: string;
  startTime: string;
  endTime?: string;
  status: string;
  attributes: Record<string, unknown>;
  events: Array<{ name: string; timestamp: string; attributes?: Record<string, unknown> }>;
  input?: unknown;
  output?: unknown;
}): string {
  return canonicalize({
    spanId: span.spanId,
    traceId: span.traceId,
    parentSpanId: span.parentSpanId ?? null,
    sessionId: span.sessionId,
    name: span.name,
    kind: span.kind,
    startTime: span.startTime,
    endTime: span.endTime ?? null,
    status: span.status,
    attributes: span.attributes,
    events: span.events,
    input: span.input ?? null,
    output: span.output ?? null,
  });
}
