import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import {
  verifyChain,
  computeMerkleRoot,
  computeContentHash,
  computeChainHash,
  verifySignature,
  GENESIS_HASH,
} from '@yfwdecimal/core';
import type { TraceRecord, Span } from '@yfwdecimal/core';
import type { VercelRequest, VercelResponse } from '@vercel/node';

/* ── Prisma singleton ── */
const connectionString = process.env.DATABASE_URL!;
const adapter = new PrismaPg({ connectionString });
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient({ adapter });
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

/* ── Fastify app ── */
let appReady: ReturnType<typeof Fastify> | null = null;

async function getApp() {
  if (appReady) return appReady;

  const app = Fastify({ logger: false });
  await app.register(cors, { origin: true });

  // --- Health ---
  app.get('/api/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

  // --- Sessions ---
  app.get('/api/sessions', async () => {
    const sessions = await prisma.session.findMany({
      include: { _count: { select: { records: true } } },
      orderBy: { startedAt: 'desc' },
    });
    return { sessions };
  });

  app.get('/api/sessions/:id', async (request) => {
    const { id } = request.params as { id: string };
    const session = await prisma.session.findUnique({
      where: { id },
      include: { _count: { select: { records: true } }, records: { orderBy: { sequenceNumber: 'asc' } } },
    });
    return { session };
  });

  // --- Traces ---
  app.get('/api/traces/:sessionId', async (request) => {
    const { sessionId } = request.params as { sessionId: string };
    const records = await prisma.traceRecord.findMany({
      where: { sessionId },
      orderBy: { sequenceNumber: 'asc' },
    });
    return { sessionId, count: records.length, records };
  });

  app.post('/api/traces', async (request, reply) => {
    const { sessionId, projectId, records } = request.body as {
      sessionId: string; projectId: string; records: TraceRecord[];
    };
    if (!sessionId || !projectId || !records?.length) {
      return reply.status(400).send({ error: 'sessionId, projectId, and records[] are required' });
    }
    await prisma.session.upsert({
      where: { id: sessionId },
      create: { id: sessionId, projectId, name: `Session ${new Date().toISOString()}` },
      update: {},
    });
    const created = await prisma.traceRecord.createMany({
      data: records.map((r) => ({
        id: r.id, sessionId, sequenceNumber: r.sequenceNumber,
        spanData: r.span as any, contentHash: r.contentHash,
        previousHash: r.previousHash, chainHash: r.chainHash,
        signature: r.signature, publicKey: r.publicKey,
      })),
      skipDuplicates: true,
    });
    return reply.status(201).send({ ingested: created.count, sessionId });
  });

  // --- Verify ---
  app.post('/api/verify', async (request) => {
    const { sessionId } = request.body as { sessionId: string };
    const dbRecords = await prisma.traceRecord.findMany({
      where: { sessionId },
      orderBy: { sequenceNumber: 'asc' },
    });
    if (!dbRecords.length) return { valid: false, chainLength: 0, message: 'No records found' };

    const records: TraceRecord[] = dbRecords.map((r: any) => ({
      id: r.id, sequenceNumber: r.sequenceNumber, span: r.spanData as Span,
      contentHash: r.contentHash, previousHash: r.previousHash,
      chainHash: r.chainHash, signature: r.signature, publicKey: r.publicKey,
      timestamp: r.createdAt.toISOString(),
    }));

    const result = verifyChain(records);
    let merkleRoot: string | undefined;
    if (result.valid) {
      merkleRoot = computeMerkleRoot(records.map((r) => r.chainHash));
    }
    return { ...result, merkleRoot };
  });

  app.post('/api/verify/tamper-point', async (request) => {
    const { sessionId } = request.body as { sessionId: string };
    const dbRecords = await prisma.traceRecord.findMany({
      where: { sessionId },
      orderBy: { sequenceNumber: 'asc' },
    });

    for (let i = 0; i < dbRecords.length; i++) {
      const r = dbRecords[i] as any;
      const expectedContent = computeContentHash(r.spanData as Span);
      if (expectedContent !== r.contentHash) {
        return { tampered: true, index: i, error: `Content hash mismatch at record #${i}` };
      }
      const expectedPrev = i === 0 ? GENESIS_HASH : dbRecords[i - 1].chainHash;
      if (r.previousHash !== expectedPrev) {
        return { tampered: true, index: i, error: `Previous hash mismatch at record #${i}` };
      }
      const expectedChain = computeChainHash(r.contentHash, r.previousHash);
      if (expectedChain !== r.chainHash) {
        return { tampered: true, index: i, error: `Chain hash mismatch at record #${i}` };
      }
      if (!verifySignature(r.chainHash, r.signature, r.publicKey)) {
        return { tampered: true, index: i, error: `Invalid signature at record #${i}` };
      }
    }
    return { tampered: false, message: 'No tamper point found' };
  });

  // --- Export ---
  app.get('/api/export/:sessionId', async (request) => {
    const { sessionId } = request.params as { sessionId: string };
    const query = request.query as { standard?: string };
    const standard = query.standard || 'ISO_42001';

    const dbRecords = await prisma.traceRecord.findMany({
      where: { sessionId },
      orderBy: { sequenceNumber: 'asc' },
    });

    const records: TraceRecord[] = dbRecords.map((r: any) => ({
      id: r.id, sequenceNumber: r.sequenceNumber, span: r.spanData as Span,
      contentHash: r.contentHash, previousHash: r.previousHash,
      chainHash: r.chainHash, signature: r.signature, publicKey: r.publicKey,
      timestamp: r.createdAt.toISOString(),
    }));

    const result = verifyChain(records);
    const merkleRoot = computeMerkleRoot(records.map((r) => r.chainHash));

    return {
      standard, generatedAt: new Date().toISOString(), sessionId,
      chainIntegrity: result, merkleRoot,
      signingKeyFingerprint: records[0]?.publicKey?.slice(0, 16) || 'N/A',
      traceCount: records.length,
      timeRange: {
        start: records[0]?.timestamp || '',
        end: records[records.length - 1]?.timestamp || '',
      },
      records,
    };
  });

  // --- Projects ---
  app.get('/api/projects', async () => {
    const projects = await prisma.project.findMany({
      include: { _count: { select: { sessions: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return { projects };
  });

  await app.ready();
  appReady = app;
  return app;
}

/* ── Vercel Handler ── */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const app = await getApp();
  app.server.emit('request', req, res);
}
