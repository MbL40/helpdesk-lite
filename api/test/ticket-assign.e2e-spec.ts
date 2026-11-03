import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from './utils/create-test-app.js';
import { ensureOrganization, ensureUser, E2E_PASSWORD, prisma } from './utils/fixtures.js';

describe('Ticket assign race condition (e2e)', () => {
  let app: INestApplication;
  let agentToken1: string;
  let agentToken2: string;
  let ticketId: string;

  beforeAll(async () => {
    app = await createTestApp();

    const org = await ensureOrganization('e2e-assign-org', 'E2E Assign Org');
    const customer = await ensureUser(org.id, 'customer@e2e-assign.com', 'E2E Customer', 'CUSTOMER');
    await ensureUser(org.id, 'agent1@e2e-assign.com', 'E2E Agent 1', 'AGENT');
    await ensureUser(org.id, 'agent2@e2e-assign.com', 'E2E Agent 2', 'AGENT');

    const login1 = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ slug: 'e2e-assign-org', email: 'agent1@e2e-assign.com', password: E2E_PASSWORD });
    agentToken1 = login1.body.accessToken;

    const login2 = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ slug: 'e2e-assign-org', email: 'agent2@e2e-assign.com', password: E2E_PASSWORD });
    agentToken2 = login2.body.accessToken;

    const ticket = await prisma.ticket.create({
      data: {
        orgId: org.id,
        customerId: customer.id,
        title: `Ticket condición de carrera ${Date.now()}`,
        description: 'Creado directo por el test, sin agente asignado',
        priority: 'MEDIUM',
      },
    });
    ticketId = ticket.id;
  });

  afterAll(async () => {
    await prisma.auditLog.deleteMany({ where: { ticketId } });
    await prisma.ticket.delete({ where: { id: ticketId } });
    await app.close();
    await prisma.$disconnect();
  });

  it('exactamente un agente gana cuando dos piden asignarse el mismo ticket a la vez', async () => {
    const [res1, res2] = await Promise.all([
      request(app.getHttpServer())
        .patch(`/api/tickets/${ticketId}/assign`)
        .set('Authorization', `Bearer ${agentToken1}`),
      request(app.getHttpServer())
        .patch(`/api/tickets/${ticketId}/assign`)
        .set('Authorization', `Bearer ${agentToken2}`),
    ]);

    expect([res1.status, res2.status].sort((a, b) => a - b)).toEqual([200, 409]);
  });
});
