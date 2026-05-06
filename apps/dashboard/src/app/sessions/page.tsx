"use client";

import { useState } from "react";

const DEMO_SESSIONS = [
  { id: "sess-a1b2c3d4", name: "GPT-4 Research Agent", status: "verified", traces: 342, started: "2025-12-15T14:21:00Z", agent: "research-agent-v2", integrity: 100, merkleRoot: "a7f3e2d1c4b5a6b7c8d9e0f1" },
  { id: "sess-e5f6a7b8", name: "Code Review Agent", status: "verified", traces: 128, started: "2025-12-15T14:45:00Z", agent: "code-reviewer-v1", integrity: 100, merkleRoot: "b8e4f3c2d5a6b7c8d9e0f1a2" },
  { id: "sess-c9d0e1f2", name: "Customer Support Bot", status: "tampered", traces: 89, started: "2025-12-15T11:30:00Z", agent: "support-agent-v3", integrity: 75.3, merkleRoot: "c9d5e4f3a6b7c8d9e0f1a2b3" },
  { id: "sess-a3b4c5d6", name: "Data Analysis Pipeline", status: "verified", traces: 567, started: "2025-12-15T13:00:00Z", agent: "analytics-v2", integrity: 100, merkleRoot: "d0e6f5a4b7c8d9e0f1a2b3c4" },
  { id: "sess-e7f8a9b0", name: "Trading Signal Agent", status: "pending", traces: 43, started: "2025-12-15T14:55:00Z", agent: "trading-v1", integrity: null, merkleRoot: null },
  { id: "sess-c1d2e3f4", name: "RAG Knowledge Agent", status: "verified", traces: 221, started: "2025-12-15T09:15:00Z", agent: "rag-agent-v4", integrity: 100, merkleRoot: "e1f7a6b5c8d9e0f1a2b3c4d5" },
  { id: "sess-a5b6c7d8", name: "Compliance Checker", status: "verified", traces: 156, started: "2025-12-15T10:00:00Z", agent: "compliance-v2", integrity: 100, merkleRoot: "f2a8b7c6d9e0f1a2b3c4d5e6" },
];

export default function SessionsPage() {
  const [filter, setFilter] = useState<string>("all");

  const filtered = filter === "all" ? DEMO_SESSIONS : DEMO_SESSIONS.filter((s) => s.status === filter);

  return (
    <div className="p-8 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between mb-8 animate-fade-in">
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: "var(--color-text-primary)" }}>Sessions</h1>
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            {DEMO_SESSIONS.length} agent sessions tracked • {DEMO_SESSIONS.reduce((a, s) => a + s.traces, 0).toLocaleString()} total traces
          </p>
        </div>
        <div className="flex gap-2">
          {["all", "verified", "tampered", "pending"].map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 capitalize"
              style={{
                background: filter === f ? "var(--color-accent-glow)" : "transparent",
                color: filter === f ? "var(--color-accent)" : "var(--color-text-muted)",
                border: `1px solid ${filter === f ? "rgba(16,185,129,0.3)" : "var(--color-border)"}`,
              }}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Sessions Table */}
      <div className="glass-card overflow-hidden animate-fade-in animate-fade-in-delay-1">
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
              <th className="text-left text-[11px] font-semibold uppercase tracking-wider px-6 py-4" style={{ color: "var(--color-text-muted)" }}>Session</th>
              <th className="text-left text-[11px] font-semibold uppercase tracking-wider px-6 py-4" style={{ color: "var(--color-text-muted)" }}>Agent</th>
              <th className="text-center text-[11px] font-semibold uppercase tracking-wider px-6 py-4" style={{ color: "var(--color-text-muted)" }}>Traces</th>
              <th className="text-center text-[11px] font-semibold uppercase tracking-wider px-6 py-4" style={{ color: "var(--color-text-muted)" }}>Integrity</th>
              <th className="text-center text-[11px] font-semibold uppercase tracking-wider px-6 py-4" style={{ color: "var(--color-text-muted)" }}>Status</th>
              <th className="text-right text-[11px] font-semibold uppercase tracking-wider px-6 py-4" style={{ color: "var(--color-text-muted)" }}>Merkle Root</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((session, i) => (
              <tr key={session.id}
                className="cursor-pointer transition-all duration-200"
                style={{
                  borderBottom: "1px solid var(--color-border-subtle)",
                  animationDelay: `${i * 0.05}s`,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(16,185,129,0.03)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>{session.name}</div>
                  <div className="hash-display">{session.id}</div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-xs px-2 py-1 rounded" style={{ background: "var(--color-bg-primary)", color: "var(--color-text-secondary)" }}>
                    {session.agent}
                  </span>
                </td>
                <td className="px-6 py-4 text-center text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
                  {session.traces}
                </td>
                <td className="px-6 py-4 text-center">
                  {session.integrity !== null ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--color-bg-primary)" }}>
                        <div className="h-full rounded-full transition-all duration-500" style={{
                          width: `${session.integrity}%`,
                          background: session.integrity === 100 ? "#10b981" : session.integrity > 90 ? "#f59e0b" : "#ef4444",
                        }} />
                      </div>
                      <span className="text-xs font-mono" style={{ color: session.integrity === 100 ? "#10b981" : "#ef4444" }}>
                        {session.integrity}%
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>—</span>
                  )}
                </td>
                <td className="px-6 py-4 text-center">
                  <span className={session.status === "verified" ? "badge-verified" : session.status === "tampered" ? "badge-tampered" : "badge-pending"}>
                    {session.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right hash-display">
                  {session.merkleRoot ? `${session.merkleRoot.slice(0, 16)}...` : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
