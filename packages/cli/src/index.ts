#!/usr/bin/env node

/**
 * AgentTrace CLI — Forensic audit tool for AI agent decision trails.
 *
 * Commands:
 *   verify <file>       Verify chain integrity of a trace file
 *   inspect <file>      Inspect trace records (summary, timeline, hashes)
 *   export <file>       Generate compliance evidence package
 *   keygen              Generate a new Ed25519 keypair
 *   status              Show system info and version
 *   help                Show help
 */

import { parseArgs } from 'node:util';
import { verify } from './commands/verify.js';
import { inspect } from './commands/inspect.js';
import { exportCmd } from './commands/export.js';
import { keygen } from './commands/keygen.js';
import { status } from './commands/status.js';
import { printHelp, printBanner } from './ui.js';

const VERSION = '0.1.0';

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === 'help' || command === '--help' || command === '-h') {
    printBanner();
    printHelp();
    process.exit(0);
  }

  if (command === '--version' || command === '-v') {
    console.log(`agenttrace v${VERSION}`);
    process.exit(0);
  }

  const subArgs = args.slice(1);

  try {
    switch (command) {
      case 'verify':
        await verify(subArgs);
        break;
      case 'inspect':
        await inspect(subArgs);
        break;
      case 'export':
        await exportCmd(subArgs);
        break;
      case 'keygen':
        await keygen(subArgs);
        break;
      case 'status':
        status();
        break;
      default:
        console.error(`\x1b[31m✗ Unknown command: ${command}\x1b[0m`);
        console.error(`  Run \x1b[36magenttrace help\x1b[0m for usage.`);
        process.exit(1);
    }
  } catch (err: any) {
    console.error(`\n\x1b[31m✗ Error: ${err.message}\x1b[0m`);
    process.exit(1);
  }
}

main();
