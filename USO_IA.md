# Uso de IA

## Modelo de datos

**Contexto:** el modelo (7 tablas: organizations, users, tickets, comments, audit_log,
holidays, business_hours) se diseñó primero a mano, de forma iterativa, discutiendo con la
IA cada relación y se plasmó en dbdiagram.io antes de escribir una sola línea de código.

**Uso de IA:** con el modelo ya definido por mí, le pedí traducir ese diseño a sintaxis
Prisma (schema.prisma), incluyendo convenciones como camelCase en TypeScript vs snake_case
en la base de datos (@map/@@map) y UUIDs generados por Postgres (gen_random_uuid()).

**Verificación:** corrí `npx prisma validate`/`format`, y revisé el SQL de la migración
generada antes de aceptarla — en particular el ON DELETE de cada foreign key, que decidí
dejar en RESTRICT (default de Prisma) para proteger el historial de auditoría.