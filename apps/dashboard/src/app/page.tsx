"use client";

import { useState, useEffect } from "react";
import { api, type SessionSummary, type TraceRecordDTO, type VerifyResult } from "@/lib/api";

interface DashboardStats {
  totalTraces: number;
  chainIntegrity: number;
  activeSessions: number;
  merkleRoots: number;
}

interface ChainBlock {
  seq: number;
  hash: string;
  prevHash: string;
  kind: string;
  name: string;
  sig: string;
  time: string;
}

export default function OverviewPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [chain, setChain] = useState<ChainBlock[]>([]);
  const [verifyResults, setVerifyResults] = useState<Record<string, VerifyResult>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
    try {
      const { sessions: sessionList } = await api.getSessions();
      setSessions(sessionList);

      const totalTraces = sessionList.reduce((sum, s) => sum + s._count.records, 0);

      // Verify each session to compute integrity
      const results: Record<string, VerifyResult> = {};
      let validChains = 0;
      for (const s of sessionList) {
        try {
          const r = await api.verify(s.id);
          results[s.id] = r;
          if (r.valid) validChains++;
        } catch {
          results[s.id] = { valid: false, chainLength: 0 };
        }
      }
      setVerifyResults(results);

      const integrity = sessionList.length > 0
        ? Math.round((validChains / sessionList.length) * 1000) / 10
        : 100;

      const merkleCount = Object.values(results).filter((r) => r.merkleRoot).length;

      setStats({ totalTraces, chainIntegrity: integrity, activeSessions: sessionList.length, merkleRoots: merkleCount });

      // Load chain visualization from the first session
      if (sessionList.length > 0) {
        const { records } = await api.getTraces(sessionList[0].id);
        setChain(
          records.slice(0, 8).map((r: TraceRecordDTO) => ({
            seq: r.sequenceNumber,
            hash: r.chainHash.slice(0, 12),
            prevHash: r.previousHash.slice(0, 12),
            kind: r.spanData.kind,
            name: r.spanData.name,
            sig: r.signature.slice(0, 12),
            time: new Date(r.createdAt).toLocaleTimeString("en-US", { hour12: false }),
          }))
        );
      }
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setLoading(false);
    }
  }

  loadData();
  }, []);

  if (loading) {
    return (
      <div className="p-12 max-w-[1600px] mx-auto min-h-screen bg-white">
        <div className="mb-12 border-b-4 border-black pb-4">
          <h1 className="text-[6rem] leading-none font-black tracking-tighter uppercase text-black">
            <span className="text-[#FF3000] mr-4">01.</span>OVERVIEW
          </h1>
        </div>
        <div className="grid grid-cols-4 gap-6 mb-12">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="swiss-card p-6" style={{ minHeight: "160px" }}>
              <div className="w-12 h-12 bg-[#F2F2F2] border-2 border-black animate-pulse mb-6" />
              <div className="h-6 bg-[#F2F2F2] border-2 border-black w-3/4 animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 md:p-12 lg:p-16 max-w-[1800px] mx-auto min-h-screen">
      {/* Header */}
      <div className="mb-12 border-b-4 border-black pb-4 flex justify-between items-end">
        <h1 className="text-5xl md:text-[6rem] leading-none font-black tracking-tighter uppercase text-black">
          <span className="text-[#FF3000] mr-4 md:mr-6">01.</span>OVERVIEW
        </h1>
        <div className="hidden md:flex items-center gap-4 bg-black text-white px-6 py-3 font-mono text-sm uppercase font-bold tracking-widest border-4 border-black shadow-[4px_4px_0px_0px_#FF3000]">
          <span className="w-3 h-3 bg-[#FF3000] border border-black animate-pulse" />
          SYSTEM LIVE
        </div>
      </div>

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <StatCard label="Total Traces" value={stats.totalTraces.toLocaleString()} accent="black" delay={1} />
          <StatCard label="Chain Integrity" value={`${stats.chainIntegrity}%`} accent={stats.chainIntegrity === 100 ? "black" : "red"} delay={2} />
          <StatCard label="Active Sessions" value={stats.activeSessions.toString()} accent="black" delay={3} />
          <StatCard label="Merkle Roots" value={stats.merkleRoots.toString()} accent="black" delay={4} />
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Chain Visualization */}
        <div className="xl:col-span-7 bg-white border-4 border-black p-0 flex flex-col relative group">
          <div className="border-b-4 border-black p-4 bg-[#F2F2F2] flex justify-between items-center group-hover:bg-[#FF3000] group-hover:text-white transition-colors duration-100">
            <h2 className="text-xl font-bold uppercase tracking-widest">
              <span className="text-[#FF3000] group-hover:text-black mr-2">A.</span>HASH CHAIN
            </h2>
            {sessions[0] && (
              <span className="font-mono text-xs font-bold uppercase bg-white text-black px-2 py-1 border-2 border-black">
                ID: {sessions[0].name || sessions[0].id.slice(0, 12)}
              </span>
            )}
          </div>
          <div className="p-6 md:p-10 flex-1 relative swiss-dots">
            <ChainVisualization chain={chain} />
          </div>
        </div>

        {/* Recent Sessions */}
        <div className="xl:col-span-5 bg-white border-4 border-black flex flex-col relative group">
          <div className="border-b-4 border-black p-4 bg-[#F2F2F2] group-hover:bg-black group-hover:text-white transition-colors duration-100">
            <h2 className="text-xl font-bold uppercase tracking-widest">
              <span className="text-[#FF3000] mr-2">B.</span>SESSIONS
            </h2>
          </div>
          <div className="flex flex-col flex-1 divide-y-4 divide-black">
            {sessions.map((session) => (
              <SessionRow key={session.id} session={session} verified={verifyResults[session.id]} />
            ))}
            {sessions.length === 0 && (
              <div className="p-6 font-mono text-sm uppercase font-bold text-[#555]">No sessions active</div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom row — Compliance + Activity */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-6">
        <ComplianceWidget />
        <ActivityFeed sessions={sessions} verifyResults={verifyResults} />
      </div>
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string; accent: string; delay?: number }) {
  const isRed = accent === "red";
  return (
    <div className={`swiss-card p-6 md:p-8 flex flex-col justify-between group hover:bg-black hover:text-white hover:border-black cursor-pointer transition-colors duration-100 relative overflow-hidden`}>
      <div className={`absolute top-0 right-0 w-16 h-16 border-l-4 border-b-4 border-black bg-white group-hover:bg-[#FF3000] transition-colors duration-100 flex items-center justify-center`}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" className="text-black group-hover:-rotate-45 transition-transform duration-100">
          <line x1="5" y1="12" x2="19" y2="12" />
          <polyline points="12 5 19 12 12 19" />
        </svg>
      </div>
      <div className={`text-6xl md:text-7xl font-black tracking-tighter mb-4 ${isRed ? "text-[#FF3000]" : "text-black"} group-hover:text-white`}>
        {value}
      </div>
      <div className="text-sm font-bold uppercase tracking-widest text-[#555] group-hover:text-[#AAA]">
        {label}
      </div>
    </div>
  );
}

function ChainVisualization({ chain }: { chain: ChainBlock[] }) {
  if (chain.length === 0) {
    return <div className="font-mono text-sm font-bold uppercase border-4 border-black p-4 inline-block bg-white shadow-[4px_4px_0px_0px_#FF3000]">No chain data</div>;
  }

  return (
    <div className="flex flex-col relative z-10 bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
      {chain.map((block) => (
        <div key={block.seq} className="flex border-b-4 border-black last:border-b-0 hover:bg-[#F2F2F2] transition-colors duration-100">
          <div className="w-16 md:w-24 border-r-4 border-black flex flex-col items-center justify-center p-4 bg-black text-white">
            <span className="font-mono text-xl font-black">{block.seq}</span>
          </div>
          <div className="flex-1 p-4 md:p-6">
            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 mb-2">
              <span className="text-xl font-bold uppercase tracking-tight">{block.name}</span>
              <span className="px-2 py-1 border-2 border-black bg-white text-xs font-bold uppercase tracking-widest whitespace-nowrap">
                {block.kind.replace('_', ' ')}
              </span>
              <span className="font-mono text-xs font-bold md:ml-auto bg-black text-white px-2 py-1">
                {block.time}
              </span>
            </div>
            <div className="flex flex-col md:flex-row items-start md:items-center gap-2 md:gap-4 font-mono text-xs uppercase font-bold mt-4 border-t-2 border-dashed border-black pt-4">
              <span className="text-black bg-[#F2F2F2] px-2 py-1 border border-black">HASH: {block.hash}</span>
              <span className="hidden md:inline">→</span>
              <span className="text-[#555]">PREV: {block.prevHash}</span>
              <span className="md:ml-auto text-[#FF3000]">SIG: {block.sig}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function SessionRow({ session, verified }: { session: SessionSummary; verified?: VerifyResult }) {
  const isValid = verified?.valid;
  const isPending = !verified;
  
  return (
    <div className="flex items-center p-4 md:p-6 bg-white hover:bg-black hover:text-white cursor-pointer transition-colors duration-100 group">
      <div className="w-12 h-12 border-4 border-black bg-[#F2F2F2] flex items-center justify-center text-xl font-black uppercase mr-4 group-hover:bg-[#FF3000] group-hover:border-white transition-colors duration-100">
        {(session.name || "?")[0]}
      </div>
      <div className="flex-1 min-w-0 mr-4">
        <div className="text-lg font-bold uppercase tracking-tight truncate">{session.name || session.id}</div>
        <div className="font-mono text-xs font-bold text-[#555] group-hover:text-[#AAA] uppercase mt-1">
          {session._count.records} traces
        </div>
      </div>
      <div className={`font-mono text-xs font-bold uppercase border-2 p-2 whitespace-nowrap
        ${isPending ? "border-black bg-[#F2F2F2] text-black group-hover:bg-white" : 
          isValid ? "border-black bg-black text-white group-hover:bg-white group-hover:text-black" : 
          "border-[#FF3000] bg-[#FF3000] text-white"}`}>
        {isPending ? "Pending" : isValid ? "Verified" : "Tampered"}
      </div>
    </div>
  );
}

function ComplianceWidget() {
  const standards = [
    { name: "ISO 42001", section: "A.6.2.8", status: "compliant", desc: "Audit trail" },
    { name: "ISO 27001", section: "A.8.15", status: "compliant", desc: "Logging" },
    { name: "NIST RMF", section: "MG-3.2", status: "compliant", desc: "Metrics" },
    { name: "EU AI Act", section: "Art. 12", status: "partial", desc: "Records" },
  ];

  return (
    <div className="bg-white border-4 border-black flex flex-col group hover:bg-[#F2F2F2] transition-colors duration-100">
      <div className="border-b-4 border-black p-4 bg-black text-white">
        <h2 className="text-xl font-bold uppercase tracking-widest">
          <span className="text-[#FF3000] mr-2">C.</span>COMPLIANCE
        </h2>
      </div>
      <div className="flex flex-col divide-y-2 divide-black">
        {standards.map((s) => (
          <div key={s.name} className="flex items-center p-4">
            <div className={`w-4 h-4 border-2 border-black mr-4 ${s.status === "compliant" ? "bg-black" : "bg-white"}`} />
            <span className="text-lg font-bold uppercase w-32">{s.name}</span>
            <span className="font-mono text-xs font-bold uppercase bg-white border-2 border-black px-2 py-1 mr-4 hidden md:block">
              {s.section}
            </span>
            <span className="font-mono text-xs uppercase font-bold text-[#555] flex-1 truncate">
              {s.desc}
            </span>
            <span className={`font-mono text-xs font-bold uppercase border-2 p-2 ml-4
              ${s.status === "compliant" ? "border-black bg-black text-white" : "border-black bg-white text-black"}`}>
              {s.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ActivityFeed({ sessions, verifyResults }: { sessions: SessionSummary[]; verifyResults: Record<string, VerifyResult> }) {
  const activities = sessions.slice(0, 5).map((s) => {
    const v = verifyResults[s.id];
    if (v && !v.valid) {
      return {
        time: new Date(s.startedAt).toLocaleTimeString("en-US", { hour12: false }),
        event: "TAMPER DETECTED",
        detail: `ID: ${s.id.slice(0, 8)} | BROKEN CHAIN`,
        type: "danger",
      };
    }
    return {
      time: new Date(s.startedAt).toLocaleTimeString("en-US", { hour12: false }),
      event: v?.valid ? "VERIFIED" : "RECORDED",
      detail: `ID: ${s.id.slice(0, 8)} | ${s._count.records} SIGS`,
      type: v?.valid ? "success" : "info",
    };
  });

  return (
    <div className="bg-white border-4 border-black flex flex-col group hover:bg-black hover:text-white transition-colors duration-100">
      <div className="border-b-4 border-black p-4 bg-[#FF3000] text-white">
        <h2 className="text-xl font-bold uppercase tracking-widest">
          <span className="text-black mr-2">D.</span>ACTIVITY LOG
        </h2>
      </div>
      <div className="flex flex-col p-6 gap-4 font-mono text-sm uppercase font-bold">
        {activities.map((a, i) => (
          <div key={i} className="flex flex-col md:flex-row md:items-center gap-2 border-l-4 border-black pl-4 py-1 group-hover:border-[#FF3000]">
            <span className="w-24 shrink-0 text-[#555] group-hover:text-[#AAA]">{a.time}</span>
            <span className={`px-2 py-1 border-2 ${a.type === "danger" ? "bg-[#FF3000] border-[#FF3000] text-white" : "bg-white border-black text-black group-hover:text-black"}`}>
              {a.event}
            </span>
            <span className="md:ml-auto">{a.detail}</span>
          </div>
        ))}
        {activities.length === 0 && (
          <div className="text-[#555]">NO RECENT ACTIVITY</div>
        )}
      </div>
    </div>
  );
}

