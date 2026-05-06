"use client";

import { useState, useEffect } from "react";
import { api, type SessionSummary, type VerifyResult } from "@/lib/api";

export default function SessionsPage() {
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [verifyResults, setVerifyResults] = useState<Record<string, VerifyResult>>({});
  const [filter, setFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSessions();
  }, []);

  async function loadSessions() {
    try {
      const { sessions: list } = await api.getSessions();
      setSessions(list);

      const results: Record<string, VerifyResult> = {};
      for (const s of list) {
        try {
          results[s.id] = await api.verify(s.id);
        } catch {
          results[s.id] = { valid: false, chainLength: 0 };
        }
      }
      setVerifyResults(results);
    } catch (err) {
      console.error("Failed to load sessions:", err);
    } finally {
      setLoading(false);
    }
  }

  function getStatus(s: SessionSummary): string {
    const v = verifyResults[s.id];
    if (!v) return "pending";
    return v.valid ? "verified" : "tampered";
  }

  function getIntegrity(s: SessionSummary): number | null {
    const v = verifyResults[s.id];
    if (!v) return null;
    return v.valid ? 100 : Math.round((1 - (v.errors?.length || 1) / v.chainLength) * 100 * 10) / 10;
  }

  const filtered = filter === "all" ? sessions : sessions.filter((s) => getStatus(s) === filter);

  if (loading) {
    return (
      <div className="p-8 max-w-[1400px] mx-auto">
        <h1 className="text-2xl font-semibold mb-4" style={{ color: "var(--color-text-primary)" }}>Sessions</h1>
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>Loading sessions from API...</p>
        <div className="glass-card mt-6 p-8 animate-pulse" style={{ minHeight: "300px" }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-12 rounded mb-3" style={{ background: "var(--color-border)", opacity: 1 - i * 0.2 }} />
          ))}
        </div>
      </div>
    );
  }

  const totalTraces = sessions.reduce((a, s) => a + s._count.records, 0);

  return (
    <div className="p-8 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between mb-8 animate-fade-in">
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: "var(--color-text-primary)" }}>Sessions</h1>
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            {sessions.length} agent sessions tracked • {totalTraces.toLocaleString()} total traces
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
            {filtered.map((session, i) => {
              const status = getStatus(session);
              const integrity = getIntegrity(session);
              const v = verifyResults[session.id];
              const agent = (session.metadata as Record<string, string>)?.agent || "unknown";
              const merkleRoot = v?.merkleRoot || null;

              return (
                <tr key={session.id}
                  className="cursor-pointer transition-all duration-200"
                  style={{
                    borderBottom: "1px solid var(--color-border-subtle)",
                    animationDelay: `${i * 0.05}s`,
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(16,185,129,0.03)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>{session.name || "Unnamed"}</div>
                    <div className="hash-display">{session.id.slice(0, 16)}...</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs px-2 py-1 rounded" style={{ background: "var(--color-bg-primary)", color: "var(--color-text-secondary)" }}>
                      {agent}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
                    {session._count.records}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {integrity !== null ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--color-bg-primary)" }}>
                          <div className="h-full rounded-full transition-all duration-500" style={{
                            width: `${integrity}%`,
                            background: integrity === 100 ? "#10b981" : integrity > 90 ? "#f59e0b" : "#ef4444",
                          }} />
                        </div>
                        <span className="text-xs font-mono" style={{ color: integrity === 100 ? "#10b981" : "#ef4444" }}>
                          {integrity}%
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={status === "verified" ? "badge-verified" : status === "tampered" ? "badge-tampered" : "badge-pending"}>
                      {status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right hash-display">
                    {merkleRoot ? `${merkleRoot.slice(0, 16)}...` : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
