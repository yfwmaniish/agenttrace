import type { FastifyInstance } from 'fastify';
import { prisma } from '../db/client.js';
import { verifyChain, computeMerkleRoot, computeFingerprint } from '@agenttrace/core';
import type { TraceRecord as CoreTraceRecord, Span, ComplianceExport } from '@agenttrace/core';

function toCore(dbRecord: any): CoreTraceRecord {
  return {
    id: dbRecord.id,
    sequenceNumber: dbRecord.sequenceNumber,
    span: dbRecord.spanData as Span,
    contentHash: dbRecord.contentHash,
    previousHash: dbRecord.previousHash,
    chainHash: dbRecord.chainHash,
    signature: dbRecord.signature,
    publicKey: dbRecord.publicKey,
    timestamp: dbRecord.createdAt.toISOString(),
  };
}

export async function exportRoutes(app: FastifyInstance) {
  /** Generate ISO 42001 / ISO 27001 compliance evidence export */
  app.get('/export/:sessionId', async (request, reply) => {
    const { sessionId } = request.params as { sessionId: string };
    const standard = ((request.query as any).standard || 'ISO_42001') as ComplianceExport['standard'];

    const session = await prisma.session.findUnique({ where: { id: sessionId }, include: { project: true } });
    if (!session) return reply.status(404).send({ error: 'Session not found' });

    const dbRecords = await prisma.traceRecord.findMany({
      where: { sessionId },
      orderBy: { sequenceNumber: 'asc' },
    });

    if (dbRecords.length === 0) return reply.status(404).send({ error: 'No trace records found' });

    const coreRecords = dbRecords.map(toCore);
    const verification = verifyChain(coreRecords);
    const merkleRoot = computeMerkleRoot(coreRecords.map((r) => r.chainHash));
    const fingerprint = computeFingerprint(coreRecords[0].publicKey);

    const exportData: ComplianceExport = {
      standard,
      generatedAt: new Date().toISOString(),
      sessionId,
      chainIntegrity: verification,
      merkleRoot,
      signingKeyFingerprint: fingerprint,
      traceCount: coreRecords.length,
      timeRange: {
        start: coreRecords[0].timestamp,
        end: coreRecords[coreRecords.length - 1].timestamp,
      },
      records: coreRecords,
      metadata: {
        projectName: session.project.name,
        exportVersion: '1.0.0',
        hashAlgorithm: 'SHA-256',
        signatureAlgorithm: 'Ed25519',
        chainModel: 'append-only-hash-chain',
      },
    };

    return exportData;
  });
}
