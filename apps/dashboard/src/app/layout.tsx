import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains-mono", display: "swap" });

export const metadata: Metadata = {
  title: "AgentTrace — Forensic Audit Dashboard",
  description: "Cryptographic forensic audit system for AI agent decision trails. Tamper-evident, ISO 42001 compliant.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`dark ${inter.variable} ${jetbrainsMono.variable}`}>
      <head>
      </head>
      <body className="antialiased">
        <div className="flex h-screen overflow-hidden">
          <Sidebar />
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}

function Sidebar() {
  const navItems = [
    { label: "Overview", href: "/", icon: GridIcon },
    { label: "Sessions", href: "/sessions", icon: LayersIcon },
    { label: "Verify", href: "/verify", icon: ShieldIcon },
    { label: "Export", href: "/export", icon: FileIcon },
  ];

  return (
    <aside className="w-[72px] h-screen flex flex-col items-center py-6 border-r"
      style={{ background: "var(--color-bg-secondary)", borderColor: "var(--color-border)" }}>
      {/* Logo */}
      <div className="mb-8 flex items-center justify-center w-10 h-10 rounded-lg"
        style={{ background: "var(--color-accent-glow)", border: "1px solid rgba(16,185,129,0.3)" }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <polyline points="9 12 11 14 15 10" />
        </svg>
      </div>

      {/* Nav Icons */}
      <nav className="flex flex-col gap-2 flex-1">
        {navItems.map((item) => (
          <a key={item.label} href={item.href}
            className="group relative w-10 h-10 flex items-center justify-center rounded-lg transition-all duration-200 hover:scale-110"
            style={{ color: "var(--color-text-muted)" }}
            title={item.label}>
            <item.icon />
            <span className="absolute left-14 px-2 py-1 rounded text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none"
              style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)", color: "var(--color-text-primary)" }}>
              {item.label}
            </span>
          </a>
        ))}
      </nav>

      {/* Bottom */}
      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold"
        style={{ background: "linear-gradient(135deg, #10b981, #059669)", color: "#fff" }}>
        AT
      </div>
    </aside>
  );
}

function GridIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}

function LayersIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function FileIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
    </svg>
  );
}
