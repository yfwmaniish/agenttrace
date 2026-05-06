const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function fetchAPI<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!res.ok) {
    throw new Error(`API error ${res.status}: ${await res.text()}`);
  }

  return res.json();
}

/* ── Typed API helpers ── */

export interface SessionSummary {
  id: string;
  name: string | null;
  projectId: string;
  startedAt: string;
  endedAt: string | null;
  metadata: Record<string, unknown> | null;
  _count: { records: number };
}

export interface TraceRecordDTO {
  id: string;
  sessionId: string;
  sequenceNumber: number;
  spanData: {
    name: string;
    kind: string;
    startTime: string;
    endTime: string;
    attributes?: Record<string, unknown>;
  };
  contentHash: string;
  previousHash: string;
  chainHash: string;
  signature: string;
  publicKey: string;
  createdAt: string;
}

export interface VerifyResult {
  valid: boolean;
  chainLength: number;
  errors?: string[];
  merkleRoot?: string;
  message?: string;
}

export interface TamperResult {
  tampered: boolean;
  index?: number;
  record?: TraceRecordDTO;
  error?: string;
  message?: string;
}

export const api = {
  getSessions: () =>
    fetchAPI<{ sessions: SessionSummary[] }>('/api/sessions'),

  getSession: (id: string) =>
    fetchAPI<{ session: SessionSummary & { records: TraceRecordDTO[] } }>(`/api/sessions/${id}`),

  getTraces: (sessionId: string) =>
    fetchAPI<{ sessionId: string; count: number; records: TraceRecordDTO[] }>(`/api/traces/${sessionId}`),

  verify: (sessionId: string) =>
    fetchAPI<VerifyResult>('/api/verify', {
      method: 'POST',
      body: JSON.stringify({ sessionId }),
    }),

  findTamperPoint: (sessionId: string) =>
    fetchAPI<TamperResult>('/api/verify/tamper-point', {
      method: 'POST',
      body: JSON.stringify({ sessionId }),
    }),

  exportSession: (sessionId: string, standard = 'ISO_42001') =>
    fetchAPI<Record<string, unknown>>(`/api/export/${sessionId}?standard=${standard}`),

  getProjects: () =>
    fetchAPI<{ projects: Array<{ id: string; name: string; publicKey: string; createdAt: string; _count: { sessions: number } }> }>('/api/projects'),

  health: () =>
    fetchAPI<{ status: string }>('/api/health'),
};
