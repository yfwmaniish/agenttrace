"use client";

import { useState, useEffect } from "react";
import { api, type SessionSummary } from "@/lib/api";

export default function ExportPage() {
  const [standard, setStandard] = useState("ISO_42001");
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [sessionId, setSessionId] = useState("");
  const [exporting, setExporting] = useState(false);
  const [exported, setExported] = useState(false);

  useEffect(() => {
    api.getSessions().then(({ sessions: list }) => {
      setSessions(list);
      if (list.length > 0) setSessionId(list[0].id);
    });
  }, []);

  const standards = [
    { id: "ISO_42001", name: "ISO 42001", desc: "AI Management System — Decision audit trail requirements (A.6.2.8)", icon: "🤖" },
    { id: "ISO_27001", name: "ISO 27001", desc: "Information Security — Event logging controls (A.8.15)", icon: "🔒" },
    { id: "NIST_AI_RMF", name: "NIST AI RMF", desc: "AI Risk Management Framework — Measurement (MG-3.2)", icon: "📋" },
    { id: "SOC2_TYPE2", name: "SOC 2 Type II", desc: "Trust Service Criteria — Processing Integrity (PI1)", icon: "✅" },
  ];

  const handleExport = async () => {
    if (!sessionId) return;
    setExporting(true);
    try {
      const data = await api.exportSession(sessionId, standard);
      // Trigger download of the JSON evidence package
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `agenttrace-${standard}-${sessionId.slice(0, 8)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setExported(true);
      setTimeout(() => setExported(false), 3000);
    } catch (err) {
      console.error("Export failed:", err);
      alert("Export failed. Make sure the session has trace records.");
    } finally {
      setExporting(false);
    }
  };

  const selectedSession = sessions.find((s) => s.id === sessionId);

  return (
    <div className="p-8 max-w-[1000px] mx-auto">
      <div className="mb-8 animate-fade-in">
        <h1 className="text-2xl font-semibold mb-1" style={{ color: "var(--color-text-primary)" }}>Compliance Export</h1>
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
          Generate cryptographically signed evidence packages for auditors
        </p>
      </div>

      {/* Standard Selection */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {standards.map((s, i) => (
          <button key={s.id} onClick={() => setStandard(s.id)}
            className={`glass-card p-5 text-left transition-all duration-200 animate-fade-in animate-fade-in-delay-${i + 1}`}
            style={{
              borderColor: standard === s.id ? "rgba(16,185,129,0.4)" : undefined,
              boxShadow: standard === s.id ? "0 0 30px rgba(16,185,129,0.08)" : undefined,
            }}>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-xl">{s.icon}</span>
              <span className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>{s.name}</span>
              {standard === s.id && (
                <span className="ml-auto w-5 h-5 rounded-full flex items-center justify-center"
                  style={{ background: "var(--color-accent)" }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </span>
              )}
            </div>
            <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>{s.desc}</p>
          </button>
        ))}
      </div>

      {/* Session + Export */}
      <div className="glass-card p-6 animate-fade-in animate-fade-in-delay-3">
        <label className="text-xs font-semibold uppercase tracking-wide block mb-3" style={{ color: "var(--color-text-muted)" }}>
          Session to Export
        </label>
        <div className="flex gap-3 mb-6">
          <select value={sessionId} onChange={(e) => setSessionId(e.target.value)}
            className="flex-1 px-4 py-3 rounded-lg text-sm font-mono outline-none"
            style={{ background: "var(--color-bg-primary)", border: "1px solid var(--color-border)", color: "var(--color-text-primary)" }}>
            {sessions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name || "Unnamed"} — {s.id.slice(0, 16)}... ({s._count.records} records)
              </option>
            ))}
          </select>
          <button onClick={handleExport} disabled={exporting || !sessionId}
            className="px-6 py-3 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all duration-200"
            style={{ background: exported ? "#059669" : "var(--color-accent)", color: "#fff", opacity: exporting ? 0.7 : 1 }}>
            {exported ? (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Exported!
              </>
            ) : exporting ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Export Evidence
              </>
            )}
          </button>
        </div>

        {/* Export Preview */}
        <div className="p-5 rounded-lg" style={{ background: "var(--color-bg-primary)", border: "1px solid var(--color-border-subtle)" }}>
          <div className="text-[11px] font-semibold uppercase tracking-wide mb-4" style={{ color: "var(--color-text-muted)" }}>
            Export Preview
          </div>
          <div className="flex flex-col gap-2 text-sm">
            <div className="flex justify-between">
              <span style={{ color: "var(--color-text-muted)" }}>Standard</span>
              <span className="font-medium" style={{ color: "var(--color-text-primary)" }}>{standards.find((s) => s.id === standard)?.name}</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: "var(--color-text-muted)" }}>Session</span>
              <span className="font-mono text-xs" style={{ color: "var(--color-text-accent)" }}>{selectedSession?.name || sessionId.slice(0, 16)}</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: "var(--color-text-muted)" }}>Records</span>
              <span className="font-medium" style={{ color: "var(--color-text-primary)" }}>{selectedSession?._count.records || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: "var(--color-text-muted)" }}>Format</span>
              <span className="font-medium" style={{ color: "var(--color-text-primary)" }}>JSON (signed)</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: "var(--color-text-muted)" }}>Hash Algorithm</span>
              <span className="font-mono text-xs" style={{ color: "var(--color-text-primary)" }}>SHA-256</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: "var(--color-text-muted)" }}>Signature</span>
              <span className="font-mono text-xs" style={{ color: "var(--color-text-primary)" }}>Ed25519</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: "var(--color-text-muted)" }}>Includes</span>
              <span className="font-medium" style={{ color: "var(--color-text-primary)" }}>Chain + Merkle Root + Proofs</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
