/**
 * CLI UI utilities — colored output, banners, tables, progress.
 * Zero dependencies — uses ANSI escape codes directly.
 */

// Colors
export const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  gray: '\x1b[90m',
  white: '\x1b[37m',
  bgGreen: '\x1b[42m',
  bgRed: '\x1b[41m',
  bgYellow: '\x1b[43m',
};

export function printBanner() {
  console.log(`
${c.cyan}${c.bold}  ╔══════════════════════════════════════════════╗
  ║       ${c.green}◆${c.cyan}  AgentTrace  ${c.green}◆${c.cyan}                       ║
  ║     Forensic Audit for AI Agents             ║
  ╚══════════════════════════════════════════════╝${c.reset}
`);
}

export function printHelp() {
  console.log(`${c.bold}USAGE${c.reset}
  ${c.cyan}agenttrace${c.reset} <command> [options]

${c.bold}COMMANDS${c.reset}
  ${c.green}verify${c.reset}  <file>       Verify chain integrity of a trace file
  ${c.green}inspect${c.reset} <file>       Inspect trace records (summary, timeline)
  ${c.green}export${c.reset}  <file>       Generate compliance evidence package
  ${c.green}keygen${c.reset}              Generate a new Ed25519 keypair
  ${c.green}status${c.reset}              Show system info and version
  ${c.green}help${c.reset}                Show this help

${c.bold}OPTIONS${c.reset}
  ${c.yellow}--format${c.reset}  json|table   Output format (default: table)
  ${c.yellow}--output${c.reset}  <path>       Write output to file
  ${c.yellow}--verbose${c.reset}             Show detailed output

${c.bold}EXAMPLES${c.reset}
  ${c.gray}# Verify a trace file${c.reset}
  ${c.cyan}agenttrace verify${c.reset} traces.json

  ${c.gray}# Inspect with verbose output${c.reset}
  ${c.cyan}agenttrace inspect${c.reset} traces.json --verbose

  ${c.gray}# Export ISO 42001 compliance report${c.reset}
  ${c.cyan}agenttrace export${c.reset} traces.json --output report.json

  ${c.gray}# Generate signing keypair${c.reset}
  ${c.cyan}agenttrace keygen${c.reset}
`);
}

export function success(msg: string) { console.log(`${c.green}✓${c.reset} ${msg}`); }
export function fail(msg: string) { console.log(`${c.red}✗${c.reset} ${msg}`); }
export function warn(msg: string) { console.log(`${c.yellow}⚠${c.reset} ${msg}`); }
export function info(msg: string) { console.log(`${c.blue}ℹ${c.reset} ${msg}`); }

export function heading(title: string) {
  console.log(`\n${c.bold}${c.cyan}── ${title} ${'─'.repeat(Math.max(0, 50 - title.length))}${c.reset}\n`);
}

export function keyValue(key: string, value: string, color = c.white) {
  console.log(`  ${c.gray}${key.padEnd(20)}${c.reset} ${color}${value}${c.reset}`);
}

export function hashDisplay(label: string, hash: string) {
  const short = hash.length > 32 ? hash.slice(0, 16) + '...' + hash.slice(-8) : hash;
  console.log(`  ${c.gray}${label.padEnd(20)}${c.reset} ${c.cyan}${short}${c.reset}`);
}

export function table(headers: string[], rows: string[][]) {
  const widths = headers.map((h, i) =>
    Math.max(h.length, ...rows.map(r => (r[i] || '').length)) + 2
  );

  const headerLine = headers.map((h, i) => `${c.bold}${h.padEnd(widths[i])}${c.reset}`).join('');
  const separator = widths.map(w => '─'.repeat(w)).join('');

  console.log(`  ${headerLine}`);
  console.log(`  ${c.gray}${separator}${c.reset}`);
  rows.forEach(row => {
    const line = row.map((cell, i) => cell.padEnd(widths[i])).join('');
    console.log(`  ${line}`);
  });
}

export function progressBar(current: number, total: number, width = 30): string {
  const pct = Math.round((current / total) * 100);
  const filled = Math.round((current / total) * width);
  const bar = '█'.repeat(filled) + '░'.repeat(width - filled);
  const color = pct === 100 ? c.green : pct > 80 ? c.yellow : c.red;
  return `${color}${bar}${c.reset} ${pct}%`;
}
