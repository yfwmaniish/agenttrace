"use client";

import { useState, useEffect } from "react";
import { api, type SessionSummary, type VerifyResult } from "@/lib/api";

export default function SessionsPage() {
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [verifyResults, setVerifyResults] = useState<Record<string, VerifyResult>>({});
  const [filter, setFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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

    loadSessions();
  }, []);

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
      <div className="p-12 max-w-[1600px] mx-auto min-h-screen bg-white">
        <div className="mb-12 border-b-4 border-black pb-4">
          <h1 className="text-[6rem] leading-none font-black tracking-tighter uppercase text-black">
            <span className="text-[#FF3000] mr-4">02.</span>SESSIONS
          </h1>
        </div>
        <div className="border-4 border-black p-8 animate-pulse bg-white min-h-[400px]">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-[#F2F2F2] border-b-4 border-black mb-4" />
          ))}
        </div>
      </div>
    );
  }

  const totalTraces = sessions.reduce((a, s) => a + s._count.records, 0);

  return (
    <div className="p-8 md:p-12 lg:p-16 max-w-[1800px] mx-auto min-h-screen">
      {/* Header */}
      <div className="mb-12 border-b-4 border-black pb-4 flex flex-col md:flex-row md:justify-between md:items-end gap-6">
        <div>
          <h1 className="text-5xl md:text-[6rem] leading-none font-black tracking-tighter uppercase text-black">
            <span className="text-[#FF3000] mr-4 md:mr-6">02.</span>SESSIONS
          </h1>
          <p className="font-mono text-sm uppercase font-bold text-[#555] mt-4 tracking-widest">
            {sessions.length} AGENT SESSIONS TRACKED • {totalTraces.toLocaleString()} TOTAL TRACES
          </p>
        </div>
        
        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          {["all", "verified", "tampered", "pending"].map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-2 text-sm font-bold uppercase tracking-widest border-2 transition-all duration-100
                ${filter === f 
                  ? f === "tampered" ? "bg-[#FF3000] border-[#FF3000] text-white" : "bg-black border-black text-white" 
                  : "bg-white border-black text-black hover:bg-[#F2F2F2]"}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white border-4 border-black overflow-hidden relative shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-black text-white">
              <th className="text-sm font-bold uppercase tracking-widest px-6 py-4 border-b-4 border-black w-2/5">Session</th>
              <th className="text-sm font-bold uppercase tracking-widest px-6 py-4 border-b-4 border-black border-l-2">Agent</th>
              <th className="text-sm font-bold uppercase tracking-widest px-6 py-4 border-b-4 border-black border-l-2 text-center">Traces</th>
              <th className="text-sm font-bold uppercase tracking-widest px-6 py-4 border-b-4 border-black border-l-2 text-center">Integrity</th>
              <th className="text-sm font-bold uppercase tracking-widest px-6 py-4 border-b-4 border-black border-l-2 text-center">Status</th>
              <th className="text-sm font-bold uppercase tracking-widest px-6 py-4 border-b-4 border-black border-l-2 text-right">Merkle Root</th>
            </tr>
          </thead>
          <tbody className="divide-y-2 divide-black">
            {filtered.map((session) => {
              const status = getStatus(session);
              const integrity = getIntegrity(session);
              const v = verifyResults[session.id];
              const agent = (session.metadata as Record<string, string>)?.agent || "unknown";
              const merkleRoot = v?.merkleRoot || null;
              
              const isTampered = status === "tampered";
              const isVerified = status === "verified";

              return (
                <tr key={session.id}
                  className="cursor-pointer transition-colors duration-100 bg-white hover:bg-black hover:text-white group"
                >
                  <td className="px-6 py-4 border-r-2 border-black group-hover:border-white">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 flex items-center justify-center text-xl font-black uppercase border-2 
                        ${isTampered ? "bg-[#FF3000] border-[#FF3000] text-white" : "bg-[#F2F2F2] border-black text-black group-hover:bg-white"}`}>
                        {(session.name || "?")[0]}
                      </div>
                      <div>
                        <div className="text-lg font-bold uppercase tracking-tight">{session.name || "Unnamed"}</div>
                        <div className="font-mono text-xs text-[#555] group-hover:text-[#AAA]">ID: {session.id.slice(0, 16)}...</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 border-r-2 border-black group-hover:border-white">
                    <span className="font-mono text-xs font-bold uppercase border-2 border-black px-2 py-1 bg-white text-black">
                      {agent}
                    </span>
                  </td>
                  <td className="px-6 py-4 border-r-2 border-black group-hover:border-white text-center text-lg font-bold">
                    {session._count.records}
                  </td>
                  <td className="px-6 py-4 border-r-2 border-black group-hover:border-white text-center">
                    {integrity !== null ? (
                      <div className="flex flex-col items-center justify-center gap-1">
                        <span className={`font-mono text-lg font-black ${integrity === 100 ? "text-black group-hover:text-white" : "text-[#FF3000]"}`}>
                          {integrity}%
                        </span>
                        <div className="w-24 h-2 border-2 border-black bg-white">
                          <div className={`h-full ${integrity === 100 ? "bg-black" : "bg-[#FF3000]"}`} style={{ width: `${integrity}%` }} />
                        </div>
                      </div>
                    ) : (
                      <span className="font-mono text-[#555] group-hover:text-[#AAA]">N/A</span>
                    )}
                  </td>
                  <td className="px-6 py-4 border-r-2 border-black group-hover:border-white text-center">
                    <span className={`font-mono text-xs font-bold uppercase border-2 px-3 py-1 whitespace-nowrap
                      ${status === "pending" ? "border-black bg-[#F2F2F2] text-black group-hover:bg-white" : 
                        isVerified ? "border-black bg-black text-white group-hover:bg-white group-hover:text-black" : 
                        "border-[#FF3000] bg-[#FF3000] text-white"}`}>
                      {status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {merkleRoot ? (
                      <span className="font-mono text-xs font-bold uppercase bg-[#F2F2F2] text-black border border-black px-2 py-1 group-hover:bg-white">
                        {merkleRoot.slice(0, 16)}...
                      </span>
                    ) : (
                      <span className="font-mono text-[#555] group-hover:text-[#AAA]">NONE</span>
                    )}
                  </td>
                </tr>
              );
            })}
            
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center font-mono text-lg font-bold uppercase text-[#555]">
                  No sessions match current filter
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
