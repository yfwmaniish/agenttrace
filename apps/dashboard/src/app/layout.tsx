import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap", weight: ["400", "500", "700", "900"] });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains-mono", display: "swap" });

export const metadata: Metadata = {
  title: "AgentTrace — Forensic Audit Dashboard",
  description: "Cryptographic forensic audit system for AI agent decision trails. Tamper-evident, ISO 42001 compliant.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <head>
      </head>
      <body className="antialiased swiss-noise bg-white text-black min-h-screen">
        <div className="flex h-screen overflow-hidden">
          <Sidebar />
          <main className="flex-1 overflow-y-auto relative swiss-grid-pattern">
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
    <aside className="w-[88px] h-screen flex flex-col items-center py-8 border-r-4 border-black bg-white z-50 relative">
      {/* Logo */}
      <div className="mb-12 flex items-center justify-center w-14 h-14 border-4 border-black bg-white group transition-all duration-100 hover:bg-black cursor-pointer" title="AgentTrace">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="square" className="text-black group-hover:text-white transition-colors">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <polyline points="9 12 11 14 15 10" />
        </svg>
      </div>

      {/* Nav Icons */}
      <nav className="flex flex-col gap-6 flex-1 w-full px-4">
        {navItems.map((item) => (
          <a key={item.label} href={item.href}
            className="group relative w-full aspect-square flex items-center justify-center border-2 border-transparent hover:border-black hover:bg-black transition-all duration-100 text-black hover:text-white"
            title={item.label}>
            <item.icon />
            {/* Tooltip */}
            <span className="absolute left-[70px] px-3 py-1 text-xs font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none bg-black text-white border-2 border-black z-50 shadow-[4px_4px_0px_0px_#FF3000]">
              {item.label}
            </span>
          </a>
        ))}
      </nav>

      {/* Bottom */}
      <div className="w-14 h-14 flex items-center justify-center text-lg font-black tracking-tighter border-4 border-black bg-[#FF3000] text-white">
        AT
      </div>
    </aside>
  );
}

function GridIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square" strokeLinejoin="miter">
      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
    </svg>
  );
}

function LayersIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square" strokeLinejoin="miter">
      <polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square" strokeLinejoin="miter">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function FileIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square" strokeLinejoin="miter">
      <path d="M14 2H6v20h12V8z" /><polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
    </svg>
  );
}
