import type { FastifyInstance } from 'fastify';
import { prisma } from '../db/client.js';
import { generateKeyPair } from '@yfwdecimal/core';
import { randomBytes } from 'crypto';

export async function projectRoutes(app: FastifyInstance) {
  /** Create a new project + API key + signing keypair */
  app.post('/projects', async (request, reply) => {
    const { name } = request.body as { name: string };
    if (!name) return reply.status(400).send({ error: 'name is required' });

    const keyPair = generateKeyPair();
    const apiKey = `at_${randomBytes(24).toString('hex')}`;

    const project = await prisma.project.create({
      data: {
        name,
        publicKey: keyPair.publicKey,
        apiKeys: { create: { key: apiKey, name: 'default' } },
      },
      include: { apiKeys: true },
    });

    return reply.status(201).send({
      project: { id: project.id, name: project.name, publicKey: project.publicKey },
      apiKey,
      keyPair: { publicKey: keyPair.publicKey, privateKey: keyPair.privateKey, fingerprint: keyPair.fingerprint },
    });
  });

  /** List projects */
  app.get('/projects', async () => {
    const projects = await prisma.project.findMany({
      select: { id: true, name: true, publicKey: true, createdAt: true, _count: { select: { sessions: true } } },
    });
    return { projects };
  });
}
