import { PrismaPg } from '@prisma/adapter-pg';
import * as argon2 from 'argon2';
import { PrismaClient } from '../../src/generated/prisma/client.js';
import type { UserRole } from '../../src/generated/prisma/enums.js';

export const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

export const E2E_PASSWORD = 'Test1234!';

export function ensureOrganization(slug: string, name: string) {
  return prisma.organization.upsert({
    where: { slug },
    update: {},
    create: { slug, name },
  });
}

export async function ensureUser(orgId: string, email: string, name: string, role: UserRole) {
  const passwordHash = await argon2.hash(E2E_PASSWORD, { type: argon2.argon2id });
  return prisma.user.upsert({
    where: { orgId_email: { orgId, email } },
    update: {},
    create: { orgId, email, passwordHash, name, role },
  });
}
