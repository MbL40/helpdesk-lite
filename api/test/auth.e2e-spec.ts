import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from './utils/create-test-app.js';
import { ensureOrganization, ensureUser, E2E_PASSWORD, prisma } from './utils/fixtures.js';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  const slug = 'e2e-auth-org';

  beforeAll(async () => {
    app = await createTestApp();
    const org = await ensureOrganization(slug, 'E2E Auth Org');
    await ensureUser(org.id, 'customer@e2e-auth.com', 'E2E Customer', 'CUSTOMER');
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  it('inicia sesión con credenciales válidas y devuelve los tokens', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ slug, email: 'customer@e2e-auth.com', password: E2E_PASSWORD });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('accessToken');
    expect(res.body).toHaveProperty('refreshToken');
    expect(res.body.user.email).toBe('customer@e2e-auth.com');
  });

  it('rechaza una contraseña incorrecta', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ slug, email: 'customer@e2e-auth.com', password: 'wrong-password' });

    expect(res.status).toBe(401);
  });

  it('rechaza un slug de organización inexistente', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ slug: 'no-existe', email: 'customer@e2e-auth.com', password: E2E_PASSWORD });

    expect(res.status).toBe(404);
  });

  it('rechaza un endpoint protegido sin token', async () => {
    const res = await request(app.getHttpServer()).get('/api/tickets');
    expect(res.status).toBe(401);
  });

  it('permite un endpoint protegido con un token válido', async () => {
    const login = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ slug, email: 'customer@e2e-auth.com', password: E2E_PASSWORD });

    const res = await request(app.getHttpServer())
      .get('/api/tickets')
      .set('Authorization', `Bearer ${login.body.accessToken}`);

    expect(res.status).toBe(200);
  });
});
