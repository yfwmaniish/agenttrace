"use client";

import { useState, useEffect } from "react";
import { api, type SessionSummary } from "@/lib/api";

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
    <div className="p-8 md:p-12 lg:p-16 max-w-[1200px] mx-auto min-h-screen">
      <div className="mb-12 border-b-4 border-black pb-4">
        <h1 className="text-5xl md:text-[6rem] leading-none font-black tracking-tighter uppercase text-black">
          <span className="text-[#FF3000] mr-4 md:mr-6">03.</span>VERIFY
        </h1>
        <p className="font-mono text-sm uppercase font-bold text-[#555] mt-4 tracking-widest">
          CRYPTOGRAPHICALLY VERIFY THE INTEGRITY OF ANY AGENT SESSION&apos;S AUDIT TRAIL
        </p>
      </div>

      {/* Input */}
      <div className="bg-white border-4 border-black p-6 md:p-8 mb-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative z-10">
        <label className="text-xl font-bold uppercase tracking-widest block mb-4 border-l-8 border-[#FF3000] pl-4">
          TARGET SESSION ID
        </label>
        <div className="flex flex-col md:flex-row gap-4">
          <select value={sessionId} onChange={(e) => setSessionId(e.target.value)}
            className="flex-1 px-4 py-4 text-lg font-mono font-bold uppercase border-4 border-black outline-none bg-[#F2F2F2] focus:bg-white transition-colors duration-100 cursor-pointer appearance-none rounded-none"
            style={{
              backgroundImage: `url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23000%22%20stroke-width%3D%224%22%20stroke-linecap%3D%22square%22%20stroke-linejoin%3D%22miter%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E")`,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 1rem top 50%",
              backgroundSize: "1.5rem auto"
            }}>
            {sessions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name || "UNNAMED"} — {s.id.slice(0, 16)}... ({s._count.records} RECORDS)
              </option>
            ))}
          </select>
          <button onClick={runVerification} disabled={verifying || !sessionId}
            className={`px-8 py-4 text-xl font-black uppercase tracking-widest border-4 border-black transition-all duration-100 flex items-center justify-center gap-4
              ${verifying ? "bg-[#F2F2F2] text-[#555] cursor-not-allowed" : "bg-[#FF3000] text-white hover:bg-black hover:text-white"}`}>
            {verifying ? (
              <>
                <span className="w-6 h-6 border-4 border-black border-t-transparent animate-spin" />
                VERIFYING
              </>
            ) : (
              <>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                EXECUTE
              </>
            )}
          </button>
        </div>
      </div>

      {/* Result */}
      {result && (
        <div className={`border-4 border-black relative ${result.valid ? "bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]" : "bg-[#FF3000] text-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"}`}>
          {/* Status Banner */}
          <div className="flex flex-col md:flex-row items-start md:items-center p-6 md:p-8 border-b-4 border-black bg-black text-white">
            <div className={`w-16 h-16 flex items-center justify-center border-4 mr-6 shrink-0
              ${result.valid ? "border-white bg-black" : "border-white bg-[#FF3000]"}`}>
              {result.valid ? (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              )}
            </div>
            <div className="flex-1 mt-4 md:mt-0">
              <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter mb-2">
                {result.valid ? "INTEGRITY VERIFIED" : "TAMPERING DETECTED"}
              </h2>
              <p className="font-mono text-sm uppercase font-bold tracking-widest text-[#AAA]">
                {result.chainLength} RECORDS SCANNED IN {result.duration}
              </p>
            </div>
            <div className={`mt-6 md:mt-0 px-6 py-3 border-4 font-black text-2xl uppercase tracking-widest
              ${result.valid ? "border-white bg-white text-black" : "border-white bg-[#FF3000] text-white"}`}>
              {result.valid ? "PASS" : "FAIL"}
            </div>
          </div>

          {/* Details Grid */}
          <div className={`grid grid-cols-2 lg:grid-cols-4 divide-y-4 lg:divide-y-0 lg:divide-x-4 border-b-4 divide-black border-black
            ${result.valid ? "bg-[#F2F2F2]" : "bg-[#CC2600]"}`}>
            <DetailRow label="CHAIN LENGTH" value={`${result.chainLength} BLOCKS`} />
            <DetailRow label="EXECUTION TIME" value={result.duration} />
            <DetailRow label="TIMESTAMP" value={new Date(result.verifiedAt).toLocaleTimeString("en-US", { hour12: false })} />
            <DetailRow label="ANOMALIES" value={result.errors.length.toString()} isError={result.errors.length > 0} />
          </div>

          {/* Merkle Root */}
          <div className={`p-6 md:p-8 ${result.valid ? "bg-white" : "bg-[#FF3000]"}`}>
            <div className="text-sm font-bold uppercase tracking-widest mb-2 border-l-4 border-black pl-2">MERKLE ROOT HASH</div>
            <div className={`p-4 font-mono text-lg font-bold break-all border-4 border-black
              ${result.valid ? "bg-black text-white" : "bg-white text-black"}`}>
              {result.merkleRoot}
            </div>
          </div>

          {/* Errors */}
          {result.errors.length > 0 && (
            <div className="border-t-4 border-black bg-white text-black">
              <div className="p-4 bg-black text-white text-xl font-black uppercase tracking-widest">
                FORENSIC REPORT: {result.errors.length} ANOMALIES FOUND
              </div>
              
              <div className="divide-y-4 divide-black">
                {result.errors.map((err, i) => (
                  <div key={i} className="flex flex-col">
                    <div className="p-4 bg-[#FF3000] text-white border-b-4 border-black flex items-center">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" className="mr-4">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                      </svg>
                      <span className="font-bold uppercase tracking-widest flex-1">
                        {err.type === "tamper_point" ? "CONTENT MUTATION DETECTED" : "CHAIN LINKAGE BROKEN"}
                      </span>
                      <span className="font-mono text-xs font-bold bg-white text-black px-2 py-1 border-2 border-black">
                        PRIORITY: CRITICAL
                      </span>
                    </div>
                    <div className="p-6 md:p-8 font-mono text-sm font-bold uppercase">
                      <div className="mb-6">{err.message}</div>
                      
                      {/* Visual Diff Simulation - Brutalist version */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 border-4 border-black">
                        <div className="border-b-4 lg:border-b-0 lg:border-r-4 border-black flex flex-col">
                          <div className="bg-[#F2F2F2] border-b-4 border-black p-2 text-center">EXPECTED SIGNATURE</div>
                          <div className="p-4 bg-white whitespace-pre font-mono text-xs text-[#555] overflow-x-auto">
                            {"{"}\n
                            &nbsp;&nbsp;&quot;spanId&quot;: &quot;...&quot;,\n
                            &nbsp;&nbsp;&quot;name&quot;: &quot;Escalation Decision&quot;,\n
                            <span className="bg-black text-white px-1">&nbsp;&nbsp;&quot;output&quot;: &quot;Refund approved...&quot;</span>\n
                            &nbsp;&nbsp;...\n
                            {"}"}
                          </div>
                        </div>
                        <div className="flex flex-col">
                          <div className="bg-black text-white border-b-4 border-black p-2 text-center">ACTUAL STATE (TAMPERED)</div>
                          <div className="p-4 bg-white whitespace-pre font-mono text-xs text-black overflow-x-auto relative">
                            <div className="absolute top-0 right-0 p-2 text-[#FF3000]">
                              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" className="opacity-20">
                                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                              </svg>
                            </div>
                            {"{"}\n
                            &nbsp;&nbsp;&quot;spanId&quot;: &quot;...&quot;,\n
                            &nbsp;&nbsp;&quot;name&quot;: &quot;Escalation Decision&quot;,\n
                            <span className="bg-[#FF3000] text-white px-1">&nbsp;&nbsp;&quot;output&quot;: &quot;Refund denied...&quot;</span>\n
                            &nbsp;&nbsp;...\n
                            {"}"}
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-6 p-4 border-4 border-black bg-[#F2F2F2]">
                        <span className="text-[#FF3000] mr-2">ANALYSIS:</span> 
                        BUSINESS LOGIC FIELD &apos;OUTPUT&apos; MUTATED. ORIGINAL SIGNATURE VERIFIED AGAINST AGENT&apos;S PRIVATE KEY CONFIRMS INTENT WAS &apos;APPROVE&apos;.
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function DetailRow({ label, value, isError }: { label: string; value: string; isError?: boolean }) {
  return (
    <div className="p-4 md:p-6 flex flex-col justify-center">
      <div className="text-xs font-bold uppercase tracking-widest mb-2 opacity-80">{label}</div>
      <div className={`text-2xl font-black uppercase tracking-tight ${isError ? "text-white bg-black px-2 self-start" : ""}`}>
        {value}
      </div>
    </div>
  );
}
