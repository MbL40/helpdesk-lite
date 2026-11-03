import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from './utils/create-test-app.js';
import { ensureOrganization, ensureUser, E2E_PASSWORD, prisma } from './utils/fixtures.js';

describe('Tenant isolation (e2e)', () => {
  let app: INestApplication;
  let tokenA: string;
  let ticketIdA: string;
  let ticketIdB: string;

  beforeAll(async () => {
    app = await createTestApp();

    const orgA = await ensureOrganization('e2e-tenant-a', 'E2E Tenant A');
    const orgB = await ensureOrganization('e2e-tenant-b', 'E2E Tenant B');
    await ensureUser(orgA.id, 'customer@e2e-tenant-a.com', 'Customer A', 'CUSTOMER');
    await ensureUser(orgB.id, 'customer@e2e-tenant-b.com', 'Customer B', 'CUSTOMER');

    const loginA = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ slug: 'e2e-tenant-a', email: 'customer@e2e-tenant-a.com', password: E2E_PASSWORD });
    tokenA = loginA.body.accessToken;

    const loginB = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ slug: 'e2e-tenant-b', email: 'customer@e2e-tenant-b.com', password: E2E_PASSWORD });
    const tokenB = loginB.body.accessToken;

    const ticketA = await request(app.getHttpServer())
      .post('/api/tickets')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ title: 'Ticket de A', description: 'Pertenece a la org A', priority: 'LOW' });
    ticketIdA = ticketA.body.id;

    const ticketB = await request(app.getHttpServer())
      .post('/api/tickets')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ title: 'Ticket de B', description: 'Pertenece a la org B', priority: 'LOW' });
    ticketIdB = ticketB.body.id;
  });

  afterAll(async () => {
    await prisma.auditLog.deleteMany({ where: { ticketId: { in: [ticketIdA, ticketIdB] } } });
    await prisma.ticket.deleteMany({ where: { id: { in: [ticketIdA, ticketIdB] } } });
    await app.close();
    await prisma.$disconnect();
  });

  it('un cliente de la organización A solo ve los tickets de su propia organización', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/tickets')
      .set('Authorization', `Bearer ${tokenA}`);

    const ids = res.body.map((t: { id: string }) => t.id);
    expect(ids).toContain(ticketIdA);
    expect(ids).not.toContain(ticketIdB);
  });

  it('un cliente de la organización A no puede comentar un ticket de la organización B', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/tickets/${ticketIdB}/comments`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ body: 'Intento de acceso cruzado' });

    expect(res.status).toBe(404);
  });
});
