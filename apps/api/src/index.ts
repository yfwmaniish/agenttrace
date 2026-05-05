/**
 * @agenttrace/api — Fastify REST API Server
 *
 * Endpoints:
 * - POST /api/traces     — Ingest signed trace records
 * - GET  /api/traces/:sessionId — Get all records for a session
 * - POST /api/verify     — Verify chain integrity
 * - GET  /api/export/:sessionId — Export compliance report
 * - GET  /api/health     — Health check
 */

import Fastify from 'fastify';
import cors from '@fastify/cors';
import { traceRoutes } from './routes/traces.js';
import { verifyRoutes } from './routes/verify.js';
import { exportRoutes } from './routes/export.js';
import { healthRoutes } from './routes/health.js';
import { projectRoutes } from './routes/projects.js';

export async function buildServer() {
  const app = Fastify({
    logger: {
      level: process.env.LOG_LEVEL || 'info',
      transport: {
        target: 'pino-pretty',
        options: { colorize: true },
      },
    },
  });

  await app.register(cors, { origin: true });

  // Register route modules
  await app.register(healthRoutes, { prefix: '/api' });
  await app.register(projectRoutes, { prefix: '/api' });
  await app.register(traceRoutes, { prefix: '/api' });
  await app.register(verifyRoutes, { prefix: '/api' });
  await app.register(exportRoutes, { prefix: '/api' });

  return app;
}

async function start() {
  const server = await buildServer();
  const port = Number(process.env.PORT) || 3001;
  const host = process.env.HOST || '0.0.0.0';

  try {
    await server.listen({ port, host });
    console.log(`\n🔒 AgentTrace API running at http://localhost:${port}`);
    console.log(`   Health: http://localhost:${port}/api/health\n`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

start();
