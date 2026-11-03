# HelpDesk Lite

Sistema multiempresa de tickets de soporte. Prueba técnica Full Stack — NuxtJS + NestJS + PostgreSQL.

---

## Stack

| Capa | Tecnología | Versión fijada |
|---|---|---|
| Backend | NestJS | `12.3.2` |
| ORM | Prisma | `7.10.1` |
| Linter (backend) | oxlint | `1.90.0` |
| Git hooks | Husky + commitlint + lint-staged | — |

---

## Estructura del proyecto

```
helpdesk-lite/
├── api/                    # NestJS + Prisma
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   └── src/
├── .husky/                 # Git hooks (raíz, un solo .git para todo el monorepo)
├── README.md
├── DECISIONES.md
├── SEGURIDAD.md
└── USO_IA.md
```

---

## Levantar el stack con Docker

```bash
docker compose up --build
```

## Desarrollo local (backend)

```bash
cd api
npm install
npx prisma generate
npm run start:dev
```

Requiere un `.env` en `api/` basado en `.env.example`.

---

## Documentos del proyecto

- [`DECISIONES.md`](./DECISIONES.md) — decisiones técnicas y requisitos ambiguos del enunciado
- [`SEGURIDAD.md`](./SEGURIDAD.md) — análisis del código heredado y controles implementados
- [`USO_IA.md`](./USO_IA.md) — uso de asistentes de IA durante el desarrollo
