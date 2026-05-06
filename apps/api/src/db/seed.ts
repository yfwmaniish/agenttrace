/**
 * Seed script — generates cryptographically valid demo data
 * using the real @yfwdecimal/core signing + hash-chain engine.
 */
import 'dotenv/config';
import { PrismaClient } from '../generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import {
  generateKeyPair,
  HashChain,
  computeMerkleRoot,
} from '@yfwdecimal/core';
import type { Span, SpanKind } from '@yfwdecimal/core';
import { randomUUID } from 'crypto';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

function span(name: string, kind: SpanKind, model?: string): Span {
  return {
    spanId: randomUUID(),
    traceId: randomUUID(),
    sessionId: 'seed-session',
    name,
    kind,
    startTime: new Date().toISOString(),
    endTime: new Date(Date.now() + Math.random() * 5000).toISOString(),
    status: 'completed',
    attributes: {
      ...(model ? { model } : {}),
      tokens: Math.floor(Math.random() * 2000) + 100,
    },
    events: [],
  };
}

async function seed() {
  console.log('🌱 Seeding AgentTrace database...\n');

  // Clean existing data
  await prisma.merkleRoot.deleteMany();
  await prisma.traceRecord.deleteMany();
  await prisma.session.deleteMany();
  await prisma.apiKey.deleteMany();
  await prisma.project.deleteMany();

  // --- Project ---
  const kp1 = generateKeyPair();
  const project = await prisma.project.create({
    data: {
      name: 'AI Research Lab',
      publicKey: kp1.publicKey,
      apiKeys: {
        create: { key: `at_${Buffer.from(crypto.getRandomValues(new Uint8Array(24))).toString('hex')}`, name: 'default' },
      },
    },
  });
  console.log(`✅ Project: ${project.name} (${project.id})`);

  // --- Session 1: GPT-4 Research Agent (valid chain) ---
  const sess1 = await prisma.session.create({
    data: {
      projectId: project.id,
      name: 'GPT-4 Research Agent',
      metadata: { agent: 'research-agent-v2', model: 'gpt-4-turbo' },
    },
  });

  const chain1 = new HashChain(kp1.privateKey, kp1.publicKey);
  const spans1: Span[] = [
    span('Initialize Context', 'agent_step'),
    span('GPT-4 Inference', 'llm_call', 'gpt-4-turbo'),
    span('Web Search', 'tool_invoke'),
    span('Synthesize Results', 'llm_call', 'gpt-4-turbo'),
    span('Final Decision', 'custom'),
    span('Format Output', 'agent_step'),
    span('Quality Check', 'llm_call', 'gpt-4-turbo'),
    span('Deliver Result', 'agent_step'),
  ];
  for (const s of spans1) chain1.append(s);
  const records1 = chain1.getRecords();

  await prisma.traceRecord.createMany({
    data: records1.map((r) => ({
      id: r.id,
      sessionId: sess1.id,
      sequenceNumber: r.sequenceNumber,
      spanData: r.span as any,
      contentHash: r.contentHash,
      previousHash: r.previousHash,
      chainHash: r.chainHash,
      signature: r.signature,
      publicKey: r.publicKey,
    })),
  });

  const merkle1 = computeMerkleRoot(records1.map((r) => r.chainHash));
  await prisma.merkleRoot.create({
    data: {
      sessionId: sess1.id,
      root: merkle1,
      leafCount: records1.length,
      firstSequence: 0,
      lastSequence: records1.length - 1,
    },
  });
  console.log(`✅ Session: ${sess1.name} — ${records1.length} records (VALID chain)`);

  // --- Session 2: Code Review Agent (valid chain) ---
  const kp2 = generateKeyPair();
  const sess2 = await prisma.session.create({
    data: {
      projectId: project.id,
      name: 'Code Review Agent',
      metadata: { agent: 'code-reviewer-v1', model: 'claude-3.5-sonnet' },
    },
  });

  const chain2 = new HashChain(kp2.privateKey, kp2.publicKey);
  const spans2: Span[] = [
    span('Parse Diff', 'agent_step'),
    span('Analyze Complexity', 'llm_call', 'claude-3.5-sonnet'),
    span('Check Patterns', 'tool_invoke'),
    span('Generate Review', 'llm_call', 'claude-3.5-sonnet'),
    span('Submit Comments', 'agent_step'),
  ];
  for (const s of spans2) chain2.append(s);
  const records2 = chain2.getRecords();

  await prisma.traceRecord.createMany({
    data: records2.map((r) => ({
      id: r.id,
      sessionId: sess2.id,
      sequenceNumber: r.sequenceNumber,
      spanData: r.span as any,
      contentHash: r.contentHash,
      previousHash: r.previousHash,
      chainHash: r.chainHash,
      signature: r.signature,
      publicKey: r.publicKey,
    })),
  });

  const merkle2 = computeMerkleRoot(records2.map((r) => r.chainHash));
  await prisma.merkleRoot.create({
    data: {
      sessionId: sess2.id,
      root: merkle2,
      leafCount: records2.length,
      firstSequence: 0,
      lastSequence: records2.length - 1,
    },
  });
  console.log(`✅ Session: ${sess2.name} — ${records2.length} records (VALID chain)`);

  // --- Session 3: Customer Support Bot (TAMPERED chain) ---
  const kp3 = generateKeyPair();
  const sess3 = await prisma.session.create({
    data: {
      projectId: project.id,
      name: 'Customer Support Bot',
      metadata: { agent: 'support-agent-v3', model: 'gpt-4o-mini' },
    },
  });

  const chain3 = new HashChain(kp3.privateKey, kp3.publicKey);
  const spans3: Span[] = [
    span('Greet Customer', 'agent_step'),
    span('Classify Intent', 'llm_call', 'gpt-4o-mini'),
    span('Lookup KB', 'tool_invoke'),
    span('Generate Response', 'llm_call', 'gpt-4o-mini'),
    span('Escalation Decision', 'custom'),
    span('Close Ticket', 'agent_step'),
  ];
  for (const s of spans3) chain3.append(s);
  const records3 = [...chain3.getRecords()];

  // TAMPER record #3 — corrupt the chain hash
  records3[3] = { ...records3[3], chainHash: 'TAMPERED_' + records3[3].chainHash.slice(9) };

  await prisma.traceRecord.createMany({
    data: records3.map((r) => ({
      id: r.id,
      sessionId: sess3.id,
      sequenceNumber: r.sequenceNumber,
      spanData: r.span as any,
      contentHash: r.contentHash,
      previousHash: r.previousHash,
      chainHash: r.chainHash,
      signature: r.signature,
      publicKey: r.publicKey,
    })),
  });
  console.log(`✅ Session: ${sess3.name} — ${records3.length} records (TAMPERED at #3)`);

  // --- Session 4: Trading Signal Agent ---
  const sess4 = await prisma.session.create({
    data: {
      projectId: project.id,
      name: 'Trading Signal Agent',
      metadata: { agent: 'trading-v1', model: 'gpt-4-turbo' },
    },
  });

  const chain4 = new HashChain(kp1.privateKey, kp1.publicKey);
  const spans4: Span[] = [
    span('Fetch Market Data', 'tool_invoke'),
    span('Analyze Trends', 'llm_call', 'gpt-4-turbo'),
    span('Generate Signal', 'custom'),
  ];
  for (const s of spans4) chain4.append(s);
  const records4 = chain4.getRecords();

  await prisma.traceRecord.createMany({
    data: records4.map((r) => ({
      id: r.id,
      sessionId: sess4.id,
      sequenceNumber: r.sequenceNumber,
      spanData: r.span as any,
      contentHash: r.contentHash,
      previousHash: r.previousHash,
      chainHash: r.chainHash,
      signature: r.signature,
      publicKey: r.publicKey,
    })),
  });
  console.log(`✅ Session: ${sess4.name} — ${records4.length} records (VALID chain)`);

  const total = records1.length + records2.length + records3.length + records4.length;
  console.log(`\n🎉 Seed complete! 4 sessions, ${total} total trace records.\n`);

  await prisma.$disconnect();
}

seed().catch((e) => {
  console.error('Seed failed:', e);
  process.exit(1);
});
