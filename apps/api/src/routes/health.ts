import type { FastifyInstance } from 'fastify';

export async function healthRoutes(app: FastifyInstance) {
  app.get('/health', async () => ({
    status: 'ok',
    service: 'agenttrace-api',
    version: '0.1.0',
    timestamp: new Date().toISOString(),
  }));
}
