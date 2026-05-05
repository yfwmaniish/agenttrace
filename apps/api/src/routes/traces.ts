import type { FastifyInstance } from 'fastify';
import { prisma } from '../db/client.js';
import type { TraceRecord, Span } from '@agenttrace/core';

export async function traceRoutes(app: FastifyInstance) {
  /** Ingest trace records (append-only) */
  app.post('/traces', async (request, reply) => {
    const { sessionId, projectId, records } = request.body as {
      sessionId: string;
      projectId: string;
      records: TraceRecord[];
    };

    if (!sessionId || !projectId || !records?.length) {
      return reply.status(400).send({ error: 'sessionId, projectId, and records[] are required' });
    }

    // Ensure session exists (create if not)
    await prisma.session.upsert({
      where: { id: sessionId },
      create: { id: sessionId, projectId, name: `Session ${new Date().toISOString()}` },
      update: {},
    });

    // Bulk insert trace records (append-only)
    const created = await prisma.traceRecord.createMany({
      data: records.map((r) => ({
        id: r.id,
        sessionId,
        sequenceNumber: r.sequenceNumber,
        spanData: r.span as any,
        contentHash: r.contentHash,
        previousHash: r.previousHash,
        chainHash: r.chainHash,
        signature: r.signature,
        publicKey: r.publicKey,
      })),
      skipDuplicates: true,
    });

    return reply.status(201).send({ ingested: created.count, sessionId });
  });

  /** Get all trace records for a session */
  app.get('/traces/:sessionId', async (request) => {
    const { sessionId } = request.params as { sessionId: string };
    const records = await prisma.traceRecord.findMany({
      where: { sessionId },
      orderBy: { sequenceNumber: 'asc' },
    });
    return { sessionId, count: records.length, records };
  });

  /** Get all sessions */
  app.get('/sessions', async () => {
    const sessions = await prisma.session.findMany({
      include: { _count: { select: { records: true } } },
      orderBy: { startedAt: 'desc' },
    });
    return { sessions };
  });

  /** Get a single session with metadata */
  app.get('/sessions/:id', async (request) => {
    const { id } = request.params as { id: string };
    const session = await prisma.session.findUnique({
      where: { id },
      include: {
        _count: { select: { records: true } },
        records: { orderBy: { sequenceNumber: 'asc' }, take: 1, select: { createdAt: true } },
      },
    });
    return { session };
  });
}
