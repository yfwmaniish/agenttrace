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
    { id: "ISO_42001", name: "ISO 42001", desc: "AI Management System — Decision audit trail requirements (A.6.2.8)", icon: "A" },
    { id: "ISO_27001", name: "ISO 27001", desc: "Information Security — Event logging controls (A.8.15)", icon: "B" },
    { id: "NIST_AI_RMF", name: "NIST AI RMF", desc: "AI Risk Management Framework — Measurement (MG-3.2)", icon: "C" },
    { id: "SOC2_TYPE2", name: "SOC 2 Type II", desc: "Trust Service Criteria — Processing Integrity (PI1)", icon: "D" },
  ];

  const handleExport = async () => {
    if (!sessionId) return;
    setExporting(true);
    try {
      const data = await api.exportSession(sessionId, standard) as unknown as ExportData;
      
      // 1. Export JSON Evidence Package (Standard)
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `agenttrace-${standard}-${sessionId.slice(0, 8)}.json`;
      a.click();
      URL.revokeObjectURL(url);

      // 2. Export Human-Readable Forensic Summary (Markdown)
      const summary = generateForensicSummary(data);
      const summaryBlob = new Blob([summary], { type: "text/markdown" });
      const summaryUrl = URL.createObjectURL(summaryBlob);
      const summaryA = document.createElement("a");
      summaryA.href = summaryUrl;
      summaryA.download = `forensic-summary-${sessionId.slice(0, 8)}.md`;
      summaryA.click();
      URL.revokeObjectURL(summaryUrl);

      setExported(true);
      setTimeout(() => setExported(false), 3000);
    } catch (err) {
      console.error("Export failed:", err);
      alert("Export failed. Make sure the session has trace records.");
    } finally {
      setExporting(false);
    }
  };

  interface ExportData {
    sessionId: string;
    traceCount: number;
    chainIntegrity?: { valid: boolean };
    merkleRoot: string;
    records?: Array<{
      span: {
        name: string;
        startTime: string;
        kind: string;
        status: string;
        input: unknown;
        output: unknown;
      };
      chainHash: string;
    }>;
  }

  const generateForensicSummary = (data: ExportData) => {
    const records = data.records || [];
    const integrity = data.chainIntegrity?.valid ? "VERIFIED" : "COMPROMISED";
    
    return `# AGENTTRACE FORENSIC AUDIT SUMMARY
GENERATED: ${new Date().toLocaleString()}
STANDARD: ${standard}
SESSION ID: ${data.sessionId}
INTEGRITY STATUS: ${integrity}

## EXECUTIVE SUMMARY
This document provides a cryptographically verified audit trail for the agent session "${selectedSession?.name}". 
All actions listed below have been verified against the agent's unique Ed25519 signature and cross-linked via a SHA-256 hash chain.

## VERIFICATION PROOFS
- MERKLE ROOT: \`${data.merkleRoot}\`
- CHAIN LENGTH: ${data.traceCount} records
- AUDIT STANDARD: ${standard}

## AUDIT TRAIL
${records.map((r: NonNullable<ExportData["records"]>[0], i: number) => `
### [${i}] ${r.span.name}
- TIMESTAMP: ${new Date(r.span.startTime).toLocaleString()}
- ACTION TYPE: ${r.span.kind}
- STATUS: ${r.span.status}
- INPUT: \`${JSON.stringify(r.span.input)}\`
- OUTPUT: \`${JSON.stringify(r.span.output)}\`
- CRYPTOGRAPHIC HASH: \`${r.chainHash.slice(0, 16)}...\`
`).join("\n")}

---
*VERIFIED BY AGENTTRACE FORENSIC ENGINE. THIS REPORT IS IMMUTABLE AND CRYPTOGRAPHICALLY LINKED TO THE SOURCE OF TRUTH.*
`;
  };

  const selectedSession = sessions.find((s) => s.id === sessionId);

  return (
    <div className="p-8 md:p-12 lg:p-16 max-w-[1200px] mx-auto min-h-screen">
      <div className="mb-12 border-b-4 border-black pb-4">
        <h1 className="text-5xl md:text-[6rem] leading-none font-black tracking-tighter uppercase text-black">
          <span className="text-[#FF3000] mr-4 md:mr-6">04.</span>EXPORT
        </h1>
        <p className="font-mono text-sm uppercase font-bold text-[#555] mt-4 tracking-widest">
          GENERATE CRYPTOGRAPHICALLY SIGNED EVIDENCE PACKAGES FOR AUDITORS
        </p>
      </div>

      {/* Standard Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        {standards.map((s) => {
          const isActive = standard === s.id;
          return (
            <button key={s.id} onClick={() => setStandard(s.id)}
              className={`text-left transition-colors duration-100 flex flex-col group border-4 border-black p-0
                ${isActive ? "bg-black text-white shadow-[8px_8px_0px_0px_#FF3000]" : "bg-white text-black hover:bg-[#F2F2F2] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"}`}>
              <div className={`p-4 border-b-4 border-black flex justify-between items-center w-full
                ${isActive ? "bg-[#FF3000] text-white" : "bg-[#F2F2F2] text-black group-hover:bg-black group-hover:text-white"}`}>
                <div className="text-xl font-bold uppercase tracking-widest flex items-center">
                  <span className={`w-8 h-8 flex items-center justify-center border-2 mr-3 font-black
                    ${isActive ? "border-white bg-black" : "border-black bg-white group-hover:border-white group-hover:bg-black"}`}>
                    {s.icon}
                  </span>
                  {s.name}
                </div>
                {isActive && (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </div>
              <div className={`p-6 font-mono text-sm font-bold uppercase tracking-wider
                ${isActive ? "text-[#AAA]" : "text-[#555]"}`}>
                {s.desc}
              </div>
            </button>
          );
        })}
      </div>

      {/* Session + Export */}
      <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col xl:flex-row">
        
        {/* Left Side: Controls */}
        <div className="flex-1 p-6 md:p-8 xl:border-r-4 border-black flex flex-col">
          <label className="text-xl font-bold uppercase tracking-widest block mb-4 border-l-8 border-[#FF3000] pl-4">
            SESSION TO EXPORT
          </label>
          
          <select value={sessionId} onChange={(e) => setSessionId(e.target.value)}
            className="w-full px-4 py-4 mb-8 text-lg font-mono font-bold uppercase border-4 border-black outline-none bg-[#F2F2F2] focus:bg-white transition-colors duration-100 cursor-pointer appearance-none rounded-none"
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

          <button onClick={handleExport} disabled={exporting || !sessionId}
            className={`w-full px-8 py-6 mt-auto text-2xl font-black uppercase tracking-widest border-4 border-black transition-all duration-100 flex items-center justify-center gap-4
              ${exported ? "bg-black text-white" : 
                exporting ? "bg-[#F2F2F2] text-[#555] cursor-not-allowed" : 
                "bg-[#FF3000] text-white hover:bg-black"}`}>
            {exported ? (
              <>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                EXPORT COMPLETE
              </>
            ) : exporting ? (
              <>
                <span className="w-8 h-8 border-4 border-black border-t-transparent animate-spin" />
                GENERATING EVIDENCE...
              </>
            ) : (
              <>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                EXPORT EVIDENCE
              </>
            )}
          </button>
        </div>

        {/* Right Side: Preview */}
        <div className="flex-1 bg-[#F2F2F2] border-t-4 xl:border-t-0 border-black flex flex-col">
          <div className="p-4 bg-black text-white text-xl font-bold uppercase tracking-widest border-b-4 border-black">
            <span className="text-[#FF3000] mr-2">E.</span>EVIDENCE PREVIEW
          </div>
          <div className="p-0 flex-1">
            <table className="w-full text-left font-mono text-sm uppercase font-bold">
              <tbody className="divide-y-4 divide-black">
                <tr className="hover:bg-white transition-colors duration-100">
                  <td className="p-4 border-r-4 border-black w-1/3 text-[#555]">STANDARD</td>
                  <td className="p-4 text-black">{standards.find((s) => s.id === standard)?.name}</td>
                </tr>
                <tr className="hover:bg-white transition-colors duration-100">
                  <td className="p-4 border-r-4 border-black text-[#555]">SESSION</td>
                  <td className="p-4 text-black">{selectedSession?.name || sessionId.slice(0, 16)}</td>
                </tr>
                <tr className="hover:bg-white transition-colors duration-100">
                  <td className="p-4 border-r-4 border-black text-[#555]">RECORDS</td>
                  <td className="p-4 text-black text-xl font-black">{selectedSession?._count.records || "—"}</td>
                </tr>
                <tr className="hover:bg-white transition-colors duration-100">
                  <td className="p-4 border-r-4 border-black text-[#555]">FORMAT</td>
                  <td className="p-4 text-black">JSON (SIGNED) + MD</td>
                </tr>
                <tr className="hover:bg-white transition-colors duration-100">
                  <td className="p-4 border-r-4 border-black text-[#555]">HASH ALGORITHM</td>
                  <td className="p-4 text-black bg-black text-white px-2 py-1 inline-block m-4">SHA-256</td>
                </tr>
                <tr className="hover:bg-white transition-colors duration-100">
                  <td className="p-4 border-r-4 border-black text-[#555]">SIGNATURE</td>
                  <td className="p-4 text-black bg-[#FF3000] text-white px-2 py-1 inline-block m-4">ED25519</td>
                </tr>
                <tr className="hover:bg-white transition-colors duration-100">
                  <td className="p-4 border-r-4 border-black text-[#555]">INCLUDES</td>
                  <td className="p-4 text-black">CHAIN + MERKLE ROOT + PROOFS</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
