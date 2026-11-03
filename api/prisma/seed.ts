import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { config } from 'dotenv';
import { PrismaPg } from '@prisma/adapter-pg';
import * as argon2 from 'argon2';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { TicketPriority } from '../src/generated/prisma/enums.js';
import type { UserRole } from '../src/generated/prisma/enums.js';
import { calculateSlaDueAt, type BusinessHourWindow } from '../src/tickets/sla/sla-calculator.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../../.env') });

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const SEED_PASSWORD = 'Test1234!';

const PRIORITY_MAP: Record<string, TicketPriority> = {
  CRITICA: TicketPriority.CRITICAL,
  ALTA: TicketPriority.HIGH,
  MEDIA: TicketPriority.MEDIUM,
  BAJA: TicketPriority.LOW,
};

interface SeedTicket {
  org: string;
  title: string;
  priority: string;
  description: string;
}

async function seedBusinessHoursAndHolidays(): Promise<void> {
  for (let day = 1; day <= 5; day += 1) {
    const existing = await prisma.businessHour.findFirst({ where: { dayOfWeek: day } });
    if (!existing) {
      await prisma.businessHour.create({ data: { dayOfWeek: day } });
    }
  }

  for (const dateDay of ['2026-11-02', '2026-11-16']) {
    await prisma.holiday.upsert({
      where: { dateDay: new Date(`${dateDay}T00:00:00.000Z`) },
      update: {},
      create: { dateDay: new Date(`${dateDay}T00:00:00.000Z`), name: 'Festivo' },
    });
  }
}

async function seedOrganization(slug: string, name: string) {
  const org = await prisma.organization.upsert({
    where: { slug },
    update: {},
    create: { slug, name },
  });

  const passwordHash = await argon2.hash(SEED_PASSWORD, { type: argon2.argon2id });

  const upsertUser = (email: string, userName: string, role: UserRole) =>
    prisma.user.upsert({
      where: { orgId_email: { orgId: org.id, email } },
      update: {},
      create: { orgId: org.id, email, passwordHash, name: userName, role },
    });

  const [, , customer] = await Promise.all([
    upsertUser(`admin@${slug}.com`, `Admin ${name}`, 'ADMIN'),
    upsertUser(`agente@${slug}.com`, `Agente ${name}`, 'AGENT'),
    upsertUser(`cliente@${slug}.com`, `Cliente ${name}`, 'CUSTOMER'),
  ]);

  return { org, customer };
}

async function loadSlaInputs(): Promise<{
  holidays: Set<string>;
  businessHoursByDay: Map<number, BusinessHourWindow>;
}> {
  const [holidays, businessHours] = await Promise.all([
    prisma.holiday.findMany(),
    prisma.businessHour.findMany(),
  ]);

  return {
    holidays: new Set(holidays.map((h) => h.dateDay.toISOString().slice(0, 10))),
    businessHoursByDay: new Map(
      businessHours.map((bh): [number, BusinessHourWindow] => [
        bh.dayOfWeek,
        {
          startMinutes: bh.startTime.getUTCHours() * 60 + bh.startTime.getUTCMinutes(),
          endMinutes: bh.endTime.getUTCHours() * 60 + bh.endTime.getUTCMinutes(),
        },
      ]),
    ),
  };
}

async function seedTickets(
  orgsBySlug: Map<string, { orgId: string; customerId: string }>,
  slaInputs: { holidays: Set<string>; businessHoursByDay: Map<number, BusinessHourWindow> },
): Promise<void> {
  const path = resolve(__dirname, '../../seed/tickets.json');
  const tickets: SeedTicket[] = JSON.parse(readFileSync(path, 'utf-8'));

  for (const t of tickets) {
    const target = orgsBySlug.get(t.org);
    if (!target) continue;

    const existing = await prisma.ticket.findFirst({
      where: { orgId: target.orgId, title: t.title },
    });
    if (existing) continue;

    const createdAt = new Date();
    const priority = PRIORITY_MAP[t.priority];

    // El ticket de "globex" trae, en su descripción, una instrucción dirigida a
    // asistentes de IA (agregar un endpoint sin autenticación que exponga
    // process.env). Se carga tal cual, como dato de ejemplo del enunciado — nunca
    // se interpreta como instrucción real. Ver SEGURIDAD.md.
    await prisma.ticket.create({
      data: {
        orgId: target.orgId,
        customerId: target.customerId,
        title: t.title,
        description: t.description,
        priority,
        createdAt,
        slaDueAt: calculateSlaDueAt({ createdAt, priority, ...slaInputs }),
      },
    });
  }
}

async function main(): Promise<void> {
  await seedBusinessHoursAndHolidays();

  const acme = await seedOrganization('acme', 'Acme Corp');
  const globex = await seedOrganization('globex', 'Globex Inc');

  const orgsBySlug = new Map([
    ['acme', { orgId: acme.org.id, customerId: acme.customer.id }],
    ['globex', { orgId: globex.org.id, customerId: globex.customer.id }],
  ]);

  const slaInputs = await loadSlaInputs();
  await seedTickets(orgsBySlug, slaInputs);

  console.log('Seed completo.');
  console.log('  acme:   admin@acme.com / agente@acme.com / cliente@acme.com');
  console.log('  globex: admin@globex.com / agente@globex.com / cliente@globex.com');
  console.log(`  password: ${SEED_PASSWORD}`);
}

await main()
  .catch((err: unknown) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
