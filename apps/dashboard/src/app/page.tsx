"use client";

import { useState, useEffect } from "react";

// --- Demo data for hackathon presentation ---
const DEMO_STATS = {
  totalTraces: 1847,
  chainIntegrity: 99.7,
  activeSessions: 12,
  merkleRoots: 23,
  lastVerified: "2 min ago",
};

const DEMO_SESSIONS = [
  { id: "sess-a1b2c3", name: "GPT-4 Research Agent", status: "verified", traces: 342, started: "2 hours ago", agent: "research-agent-v2" },
  { id: "sess-d4e5f6", name: "Code Review Agent", status: "verified", traces: 128, started: "45 min ago", agent: "code-reviewer-v1" },
  { id: "sess-g7h8i9", name: "Customer Support Bot", status: "tampered", traces: 89, started: "3 hours ago", agent: "support-agent-v3" },
  { id: "sess-j0k1l2", name: "Data Analysis Pipeline", status: "verified", traces: 567, started: "1 hour ago", agent: "analytics-v2" },
  { id: "sess-m3n4o5", name: "Trading Signal Agent", status: "pending", traces: 43, started: "15 min ago", agent: "trading-v1" },
];

const DEMO_CHAIN = [
  { seq: 0, hash: "a7f3e2d1c4b5", prevHash: "0000000000", kind: "agent_step", name: "Initialize Context", sig: "3d4e5f6a7b8c", time: "14:23:01" },
  { seq: 1, hash: "b8e4f3c2d5a6", prevHash: "a7f3e2d1c4b5", kind: "llm_call", name: "GPT-4 Inference", sig: "9e0f1a2b3c4d", time: "14:23:02" },
  { seq: 2, hash: "c9d5e4f3a6b7", prevHash: "b8e4f3c2d5a6", kind: "tool_invoke", name: "Web Search", sig: "5f6a7b8c9d0e", time: "14:23:04" },
  { seq: 3, hash: "d0e6f5a4b7c8", prevHash: "c9d5e4f3a6b7", kind: "llm_call", name: "Synthesize Results", sig: "1a2b3c4d5e6f", time: "14:23:06" },
  { seq: 4, hash: "e1f7a6b5c8d9", prevHash: "d0e6f5a4b7c8", kind: "decision", name: "Final Decision", sig: "7b8c9d0e1f2a", time: "14:23:08" },
];

export default function OverviewPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <div className="p-8 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="mb-8 animate-fade-in">
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-2xl font-semibold" style={{ color: "var(--color-text-primary)" }}>
            Forensic Overview
          </h1>
          <span className="badge-verified flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 pulse-glow" />
            System Verified
          </span>
        </div>
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
          Cryptographic audit trail for all AI agent decisions • ISO 42001 compliant
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Traces" value={DEMO_STATS.totalTraces.toLocaleString()} icon="📊" accent="emerald" delay={1} />
        <StatCard label="Chain Integrity" value={`${DEMO_STATS.chainIntegrity}%`} icon="🛡️" accent="emerald" delay={2} />
        <StatCard label="Active Sessions" value={DEMO_STATS.activeSessions.toString()} icon="⚡" accent="blue" delay={3} />
        <StatCard label="Merkle Roots" value={DEMO_STATS.merkleRoots.toString()} icon="🌳" accent="emerald" delay={4} />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-5 gap-6">
        {/* Chain Visualization — wider */}
        <div className="col-span-3 glass-card p-6 animate-fade-in animate-fade-in-delay-2">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-semibold tracking-wide uppercase" style={{ color: "var(--color-text-secondary)" }}>
              Hash Chain Visualization
            </h2>
            <span className="hash-display">Session: sess-a1b2c3</span>
          </div>
          <ChainVisualization chain={DEMO_CHAIN} />
        </div>

        {/* Recent Sessions */}
        <div className="col-span-2 glass-card p-6 animate-fade-in animate-fade-in-delay-3">
          <h2 className="text-sm font-semibold tracking-wide uppercase mb-5" style={{ color: "var(--color-text-secondary)" }}>
            Recent Sessions
          </h2>
          <div className="flex flex-col gap-3">
            {DEMO_SESSIONS.map((session) => (
              <SessionRow key={session.id} session={session} />
            ))}
          </div>
        </div>
      </div>

      {/* Bottom row — Compliance + Activity */}
      <div className="grid grid-cols-2 gap-6 mt-6">
        <ComplianceWidget />
        <ActivityFeed />
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, accent, delay }: { label: string; value: string; icon: string; accent: string; delay: number }) {
  const isEmerald = accent === "emerald";
  return (
    <div className={`glass-card p-5 animate-fade-in animate-fade-in-delay-${delay}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-lg">{icon}</span>
        <span className="w-2 h-2 rounded-full pulse-glow" style={{ background: isEmerald ? "#10b981" : "#3b82f6" }} />
      </div>
      <div className="text-2xl font-bold mb-1" style={{ color: "var(--color-text-primary)" }}>{value}</div>
      <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>{label}</div>
    </div>
  );
}

function ChainVisualization({ chain }: { chain: typeof DEMO_CHAIN }) {
  const kindColors: Record<string, string> = {
    agent_step: "#3b82f6",
    llm_call: "#10b981",
    tool_invoke: "#f59e0b",
    decision: "#8b5cf6",
  };

  return (
    <div className="flex flex-col gap-0">
      {chain.map((block, i) => (
        <div key={block.seq} className="flex items-start gap-4" style={{ animationDelay: `${i * 0.1}s` }}>
          {/* Chain connector */}
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold border"
              style={{
                background: `${kindColors[block.kind]}15`,
                borderColor: `${kindColors[block.kind]}40`,
                color: kindColors[block.kind],
              }}>
              #{block.seq}
            </div>
            {i < chain.length - 1 && (
              <div className="w-0.5 h-8" style={{ background: `linear-gradient(to bottom, ${kindColors[block.kind]}60, transparent)` }} />
            )}
          </div>

          {/* Block content */}
          <div className="flex-1 pb-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>{block.name}</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium" style={{
                background: `${kindColors[block.kind]}15`,
                color: kindColors[block.kind],
              }}>
                {block.kind}
              </span>
              <span className="text-[10px] ml-auto" style={{ color: "var(--color-text-muted)" }}>{block.time}</span>
            </div>
            <div className="flex items-center gap-3 hash-display">
              <span style={{ color: "var(--color-text-accent)" }}>
                ◆ {block.hash}...
              </span>
              <span>←</span>
              <span>{block.prevHash}...</span>
              <span className="ml-auto" style={{ color: "var(--color-accent-dim)" }}>
                σ {block.sig}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function SessionRow({ session }: { session: typeof DEMO_SESSIONS[0] }) {
  const statusBadge = session.status === "verified" ? "badge-verified"
    : session.status === "tampered" ? "badge-tampered" : "badge-pending";

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200"
      style={{ background: "rgba(255,255,255,0.02)" }}
      onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.02)"; }}>
      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
        style={{ background: "var(--color-accent-glow)", color: "var(--color-accent)" }}>
        {session.name[0]}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate" style={{ color: "var(--color-text-primary)" }}>{session.name}</div>
        <div className="text-[11px]" style={{ color: "var(--color-text-muted)" }}>{session.traces} traces • {session.started}</div>
      </div>
      <span className={statusBadge}>{session.status}</span>
    </div>
  );
}

function ComplianceWidget() {
  const standards = [
    { name: "ISO 42001", section: "A.6.2.8", status: "compliant", desc: "AI decision audit trail" },
    { name: "ISO 27001", section: "A.8.15", status: "compliant", desc: "Event logging" },
    { name: "NIST AI RMF", section: "MG-3.2", status: "compliant", desc: "Risk measurement" },
    { name: "EU AI Act", section: "Art. 12", status: "partial", desc: "Record-keeping" },
  ];

  return (
    <div className="glass-card p-6 animate-fade-in animate-fade-in-delay-4">
      <h2 className="text-sm font-semibold tracking-wide uppercase mb-4" style={{ color: "var(--color-text-secondary)" }}>
        Compliance Status
      </h2>
      <div className="flex flex-col gap-3">
        {standards.map((s) => (
          <div key={s.name} className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full" style={{
              background: s.status === "compliant" ? "#10b981" : "#f59e0b",
            }} />
            <span className="text-sm font-medium w-24" style={{ color: "var(--color-text-primary)" }}>{s.name}</span>
            <span className="hash-display flex-1">{s.section} — {s.desc}</span>
            <span className={s.status === "compliant" ? "badge-verified" : "badge-pending"}>
              {s.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ActivityFeed() {
  const activities = [
    { time: "14:23:08", event: "Chain verified", detail: "Session sess-a1b2c3 • 342 records • Integrity: PASS", type: "success" },
    { time: "14:22:55", event: "Tamper detected", detail: "Session sess-g7h8i9 • Record #67 modified • Chain BROKEN", type: "danger" },
    { time: "14:22:30", event: "Merkle root anchored", detail: "Root e1f7a6b5... committed to git:main@abc1234", type: "info" },
    { time: "14:22:01", event: "New session started", detail: "Trading Signal Agent • Project: hedgefund-alpha", type: "info" },
    { time: "14:21:45", event: "Export generated", detail: "ISO 42001 compliance report • Session sess-d4e5f6", type: "success" },
  ];

  const typeColors: Record<string, string> = { success: "#10b981", danger: "#ef4444", info: "#3b82f6" };

  return (
    <div className="glass-card p-6 animate-fade-in animate-fade-in-delay-4">
      <h2 className="text-sm font-semibold tracking-wide uppercase mb-4" style={{ color: "var(--color-text-secondary)" }}>
        Live Activity
      </h2>
      <div className="flex flex-col gap-3">
        {activities.map((a, i) => (
          <div key={i} className="flex items-start gap-3">
            <span className="hash-display mt-0.5 w-14 shrink-0">{a.time}</span>
            <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: typeColors[a.type] }} />
            <div>
              <div className="text-sm font-medium" style={{ color: typeColors[a.type] }}>{a.event}</div>
              <div className="text-[11px]" style={{ color: "var(--color-text-muted)" }}>{a.detail}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
