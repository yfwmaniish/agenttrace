"use client";

import { useState } from "react";

export default function VerifyPage() {
  const [sessionId, setSessionId] = useState("sess-a1b2c3d4");
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState<null | {
    valid: boolean; chainLength: number; errors: { type: string; message: string }[];
    merkleRoot: string; verifiedAt: string; duration: string;
  }>(null);

  const runVerification = () => {
    setVerifying(true);
    setResult(null);
    // Simulated verification for demo
    setTimeout(() => {
      const isTampered = sessionId.includes("c9d0");
      setResult({
        valid: !isTampered,
        chainLength: isTampered ? 89 : 342,
        errors: isTampered
          ? [
              { type: "hash_mismatch", message: "Content hash mismatch at record #67 — span data was modified after signing" },
              { type: "chain_break", message: "Chain break at record #68 — previousHash does not match record #67 chainHash" },
            ]
          : [],
        merkleRoot: "a7f3e2d1c4b5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1",
        verifiedAt: new Date().toISOString(),
        duration: isTampered ? "234ms" : "187ms",
      });
      setVerifying(false);
    }, 1500);
  };

  return (
    <div className="p-8 max-w-[1000px] mx-auto">
      <div className="mb-8 animate-fade-in">
        <h1 className="text-2xl font-semibold mb-1" style={{ color: "var(--color-text-primary)" }}>Chain Verification</h1>
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
          Cryptographically verify the integrity of any agent session's audit trail
        </p>
      </div>

      {/* Input */}
      <div className="glass-card p-6 mb-6 animate-fade-in animate-fade-in-delay-1">
        <label className="text-xs font-semibold uppercase tracking-wide block mb-3" style={{ color: "var(--color-text-muted)" }}>
          Session ID
        </label>
        <div className="flex gap-3">
          <input type="text" value={sessionId} onChange={(e) => setSessionId(e.target.value)}
            className="flex-1 px-4 py-3 rounded-lg text-sm font-mono outline-none transition-all duration-200"
            style={{
              background: "var(--color-bg-primary)",
              border: "1px solid var(--color-border)",
              color: "var(--color-text-primary)",
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(16,185,129,0.5)"; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = "var(--color-border)"; }}
            placeholder="sess-xxxxxxxx" />
          <button onClick={runVerification} disabled={verifying}
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

        {/* Quick presets */}
        <div className="flex gap-2 mt-3">
          <span className="text-[11px]" style={{ color: "var(--color-text-muted)" }}>Try:</span>
          <button onClick={() => setSessionId("sess-a1b2c3d4")} className="text-[11px] hover:underline" style={{ color: "var(--color-text-accent)" }}>Valid chain</button>
          <span style={{ color: "var(--color-text-muted)" }}>•</span>
          <button onClick={() => setSessionId("sess-c9d0e1f2")} className="text-[11px] hover:underline" style={{ color: "#f87171" }}>Tampered chain</button>
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
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wide mb-3" style={{ color: "#f87171" }}>
                Tamper Points Detected
              </div>
              {result.errors.map((err, i) => (
                <div key={i} className="p-4 rounded-lg mb-2 flex items-start gap-3"
                  style={{ background: "var(--color-danger-glow)", border: "1px solid rgba(239,68,68,0.2)" }}>
                  <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: "#ef4444" }} />
                  <div>
                    <span className="text-xs font-mono px-1.5 py-0.5 rounded mr-2"
                      style={{ background: "rgba(239,68,68,0.2)", color: "#f87171" }}>
                      {err.type}
                    </span>
                    <span className="text-sm" style={{ color: "var(--color-text-primary)" }}>{err.message}</span>
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
