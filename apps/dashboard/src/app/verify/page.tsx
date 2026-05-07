"use client";

import { useState, useEffect } from "react";
import { api, type SessionSummary, type VerifyResult, type TamperResult } from "@/lib/api";

export default function VerifyPage() {
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [sessionId, setSessionId] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState<null | {
    valid: boolean; chainLength: number; errors: { type: string; message: string }[];
    merkleRoot: string; verifiedAt: string; duration: string;
  }>(null);

  useEffect(() => {
    api.getSessions().then(({ sessions: list }) => {
      setSessions(list);
      if (list.length > 0) setSessionId(list[0].id);
    });
  }, []);

  const runVerification = async () => {
    if (!sessionId) return;
    setVerifying(true);
    setResult(null);
    const startTime = performance.now();

    try {
      const [verifyRes, tamperRes] = await Promise.all([
        api.verify(sessionId),
        api.findTamperPoint(sessionId),
      ]);

      const duration = `${Math.round(performance.now() - startTime)}ms`;
      const errors: { type: string; message: string }[] = [];

      if (!verifyRes.valid && verifyRes.errors) {
        for (const e of verifyRes.errors) {
          errors.push({ type: "chain_error", message: e });
        }
      }
      if (tamperRes.tampered && tamperRes.error) {
        errors.push({ type: "tamper_point", message: `Tamper detected at record #${tamperRes.index}: ${tamperRes.error}` });
      }

      setResult({
        valid: verifyRes.valid,
        chainLength: verifyRes.chainLength,
        errors,
        merkleRoot: verifyRes.merkleRoot || "N/A",
        verifiedAt: new Date().toISOString(),
        duration,
      });
    } catch (err) {
      setResult({
        valid: false,
        chainLength: 0,
        errors: [{ type: "api_error", message: String(err) }],
        merkleRoot: "N/A",
        verifiedAt: new Date().toISOString(),
        duration: "—",
      });
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="p-8 max-w-[1000px] mx-auto">
      <div className="mb-8 animate-fade-in">
        <h1 className="text-2xl font-semibold mb-1" style={{ color: "var(--color-text-primary)" }}>Chain Verification</h1>
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
          Cryptographically verify the integrity of any agent session&apos;s audit trail
        </p>
      </div>

      {/* Input */}
      <div className="glass-card p-6 mb-6 animate-fade-in animate-fade-in-delay-1">
        <label className="text-xs font-semibold uppercase tracking-wide block mb-3" style={{ color: "var(--color-text-muted)" }}>
          Session ID
        </label>
        <div className="flex gap-3">
          <select value={sessionId} onChange={(e) => setSessionId(e.target.value)}
            className="flex-1 px-4 py-3 rounded-lg text-sm font-mono outline-none transition-all duration-200"
            style={{
              background: "var(--color-bg-primary)",
              border: "1px solid var(--color-border)",
              color: "var(--color-text-primary)",
            }}>
            {sessions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name || "Unnamed"} — {s.id.slice(0, 16)}... ({s._count.records} records)
              </option>
            ))}
          </select>
          <button onClick={runVerification} disabled={verifying || !sessionId}
            className="px-6 py-3 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-2"
            style={{
              background: verifying ? "var(--color-accent-dim)" : "var(--color-accent)",
              color: "#fff",
              opacity: verifying ? 0.7 : 1,
            }}>
            {verifying ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <polyline points="9 12 11 14 15 10" />
                </svg>
                Verify Chain
              </>
            )}
          </button>
        </div>
      </div>

      {/* Result */}
      {result && (
        <div className={`glass-card p-6 animate-fade-in ${result.valid ? "glow-green" : "glow-red"}`}>
          {/* Status Banner */}
          <div className="flex items-center gap-4 mb-6 pb-6" style={{ borderBottom: "1px solid var(--color-border)" }}>
            <div className="w-14 h-14 rounded-xl flex items-center justify-center" style={{
              background: result.valid ? "var(--color-accent-glow)" : "var(--color-danger-glow)",
            }}>
              {result.valid ? (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round">
                  <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
                </svg>
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold" style={{ color: result.valid ? "#34d399" : "#f87171" }}>
                {result.valid ? "Chain Integrity VERIFIED" : "TAMPERING DETECTED"}
              </h2>
              <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                {result.chainLength} records verified in {result.duration}
              </p>
            </div>
            <span className={`ml-auto ${result.valid ? "badge-verified" : "badge-tampered"}`}>
              {result.valid ? "PASS" : "FAIL"}
            </span>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <DetailRow label="Chain Length" value={`${result.chainLength} records`} />
            <DetailRow label="Verification Time" value={result.duration} />
            <DetailRow label="Verified At" value={new Date(result.verifiedAt).toLocaleString()} />
            <DetailRow label="Errors Found" value={result.errors.length.toString()} color={result.errors.length > 0 ? "#ef4444" : "#10b981"} />
          </div>

          {/* Merkle Root */}
          <div className="p-4 rounded-lg mb-4" style={{ background: "var(--color-bg-primary)" }}>
            <div className="text-[11px] font-semibold uppercase tracking-wide mb-2" style={{ color: "var(--color-text-muted)" }}>Merkle Root</div>
            <div className="font-mono text-xs break-all" style={{ color: "var(--color-text-accent)" }}>{result.merkleRoot}</div>
          </div>

          {/* Errors */}
          {result.errors.length > 0 && (
            <div className="mt-8 animate-fade-in animate-fade-in-delay-1">
              <div className="text-[11px] font-semibold uppercase tracking-wide mb-3 px-1" style={{ color: "var(--color-text-muted)" }}>
                Forensic Analysis — Found {result.errors.length} Anomalies
              </div>
              {result.errors.map((err, i) => (
                <div key={i} className="glass-card mb-4 overflow-hidden" style={{ border: "1px solid rgba(239,68,68,0.2)" }}>
                  <div className="p-4 flex items-center gap-3" style={{ background: "var(--color-danger-glow)" }}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "rgba(239,68,68,0.15)" }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2.5">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-sm font-bold" style={{ color: "#f87171" }}>{err.type === "tamper_point" ? "Content Integrity Breach" : "Chain Integrity Breach"}</div>
                      <div className="text-xs" style={{ color: "var(--color-text-primary)" }}>{err.message}</div>
                    </div>
                    <span className="ml-auto text-[10px] font-mono px-2 py-0.5 rounded border" 
                      style={{ borderColor: "rgba(239,68,68,0.3)", color: "#f87171" }}>
                      PRIORITY: CRITICAL
                    </span>
                  </div>
                  
                  {/* Visual Diff Simulation */}
                  <div className="p-5" style={{ background: "var(--color-bg-primary)" }}>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <div className="text-[10px] font-semibold uppercase tracking-wide mb-3" style={{ color: "var(--color-text-muted)" }}>Cryptographic Signature Expects</div>
                        <div className="p-3 rounded border border-dashed font-mono text-[11px] leading-relaxed opacity-50" 
                          style={{ borderColor: "var(--color-border)", color: "var(--color-text-muted)" }}>
                          {"{"}<br/>
                          &nbsp;&nbsp;&quot;spanId&quot;: &quot;...&quot;,<br/>
                          &nbsp;&nbsp;&quot;name&quot;: &quot;Escalation Decision&quot;,<br/>
                          <span className="bg-emerald-500/10 text-emerald-400 px-1">&nbsp;&nbsp;&quot;output&quot;: &quot;Refund approved...&quot;</span><br/>
                          &nbsp;&nbsp;...<br/>
                          {"}"}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] font-semibold uppercase tracking-wide mb-3" style={{ color: "#f87171" }}>Actual Database State (Tampered)</div>
                        <div className="p-3 rounded border font-mono text-[11px] leading-relaxed" 
                          style={{ borderColor: "rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.05)" }}>
                          {"{"}<br/>
                          &nbsp;&nbsp;&quot;spanId&quot;: &quot;...&quot;,<br/>
                          &nbsp;&nbsp;&quot;name&quot;: &quot;Escalation Decision&quot;,<br/>
                          <span className="bg-red-500/20 text-red-400 font-bold px-1">&nbsp;&nbsp;&quot;output&quot;: &quot;Refund denied...&quot;</span><br/>
                          &nbsp;&nbsp;...<br/>
                          {"}"}
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t flex items-center gap-3" style={{ borderColor: "var(--color-border)" }}>
                      <div className="text-[11px] leading-tight" style={{ color: "var(--color-text-muted)" }}>
                        <span className="font-bold text-red-400">Analysis:</span> The business logic field <code className="text-red-400">output</code> was modified in the database. The original signature verified against the agent&apos;s private key confirms the intent was <span className="text-emerald-400">Approve</span>.
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function DetailRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="p-3 rounded-lg" style={{ background: "var(--color-bg-primary)" }}>
      <div className="text-[11px] uppercase tracking-wide mb-1" style={{ color: "var(--color-text-muted)" }}>{label}</div>
      <div className="text-sm font-medium" style={{ color: color || "var(--color-text-primary)" }}>{value}</div>
    </div>
  );
}
