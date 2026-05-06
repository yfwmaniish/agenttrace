/**
 * status — Show system info, version, and configuration.
 */

import { c, heading, keyValue, success } from '../ui.js';

export function status() {
  heading('AgentTrace System Status');
  keyValue('Version', '0.1.0');
  keyValue('Runtime', `Node.js ${process.version}`);
  keyValue('Platform', `${process.platform} (${process.arch})`);
  keyValue('Crypto', 'Ed25519 + SHA-256');
  keyValue('Hash Chain', 'FIPS 180-4 compliant');
  keyValue('Compliance', 'ISO 42001, ISO 27001, NIST AI RMF');

  heading('Components');
  success(`${c.bold}@yfwdecimal/core${c.reset}   Cryptographic engine`);
  success(`${c.bold}@yfwdecimal/sdk${c.reset}    Agent instrumentation SDK`);
  success(`${c.bold}@yfwdecimal/cli${c.reset}    Forensic audit CLI`);
  success(`${c.bold}Dashboard${c.reset}          Next.js compliance dashboard`);
  success(`${c.bold}API Server${c.reset}         Fastify append-only API`);
}
