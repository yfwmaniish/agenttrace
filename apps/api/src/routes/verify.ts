import type { FastifyInstance } from 'fastify';
import { prisma } from '../db/client.js';
import { verifyChain, findTamperPoint, computeMerkleRoot } from '@yfwdecimal/core';
import type { TraceRecord as CoreTraceRecord, Span } from '@yfwdecimal/core';

/** Convert DB record to core TraceRecord for verification */
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

export async function verifyRoutes(app: FastifyInstance) {
  /** Verify chain integrity for a session */
  app.post('/verify', async (request) => {
    const { sessionId } = request.body as { sessionId: string };

    const dbRecords = await prisma.traceRecord.findMany({
      where: { sessionId },
      orderBy: { sequenceNumber: 'asc' },
    });

    if (dbRecords.length === 0) {
      return { valid: true, chainLength: 0, message: 'No records found' };
    }

    const coreRecords = dbRecords.map(toCore);
    const result = verifyChain(coreRecords);
    const merkleRoot = computeMerkleRoot(coreRecords.map((r) => r.chainHash));

    return { ...result, merkleRoot };
  });

  /** Find the exact tamper point in a chain */
  app.post('/verify/tamper-point', async (request) => {
    const { sessionId } = request.body as { sessionId: string };

    const dbRecords = await prisma.traceRecord.findMany({
      where: { sessionId },
      orderBy: { sequenceNumber: 'asc' },
    });

    const coreRecords = dbRecords.map(toCore);
    const tamperPoint = findTamperPoint(coreRecords);

    if (!tamperPoint) {
      return { tampered: false, message: 'Chain is valid — no tampering detected' };
    }

    return {
      tampered: true,
      index: tamperPoint.index,
      record: tamperPoint.record,
      error: tamperPoint.error,
    };
  });
}
