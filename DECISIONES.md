# Decisiones

## Dependencias — versiones fijas sin excepción (`--save-exact`)

Todas las dependencias y devDependencies se fijan a versión exacta, sin rangos `^` ni `~`, incluyendo herramientas de desarrollo. Esto va más allá de lo que garantiza `package-lock.json` + `npm ci`: protege específicamente el momento en que un desarrollador corre `npm install` localmente para agregar un paquete nuevo, que puede regenerar el lock y resolver una versión distinta a la probada — incluyendo una versión comprometida en un ataque de cadena de suministro (mantenedor comprometido publicando una versión maliciosa como patch/minor, que un rango `^` instalaría automáticamente).

## ORM: Prisma en vez de TypeORM

**Type-safety del cliente generado.** El cliente se genera desde `schema.prisma` con
tipos exactos por modelo/campo; TypeORM depende de decoradores escritos a mano
(`@Entity`, `@Column`), con más riesgo de que tipo y columna real se desincronicen.

## Modelo de datos — convenciones de Prisma

**Nombres: camelCase en TS, snake_case en BD**, mapeados vía `@map`/`@@map` — evita que
el código de NestJS use nombres de columna SQL en vez de los esperados en TS.

**UUIDs generados por Postgres** (`gen_random_uuid()`) en vez del `uuid()` de Prisma
(que genera el valor en la app) — nativo desde Postgres 13, y garantiza IDs válidos
también en inserciones hechas directamente en SQL (ej. seed script)

## Multi-tenancy: subdominio por organización

**Por qué no un selector en un login genérico.** `email` es único por organización
(`UNIQUE(org_id, email)`), no global, así que hay que resolver la organización antes
de buscar el usuario. Un selector lo resuelve igual de bien — ir por subdominio real
(`acme.helpdesk.com`) es decisión de producto, no de seguridad: URL marcable por
organización, cero fricción para el usuario final, y camino natural hacia dominios
propios del cliente más adelante. Se agrega `organizations.slug` (único).

## Requisito técnicamente inviable: `whitelistStrict`

Encontré que `whitelistStrict`, la opción que pide el enunciado para `ValidationPipe`, no
existe — ni en `ValidationPipeOptions` de `@nestjs/common` ni en `ValidatorOptions` de
`class-validator`. Interpreté que lo que se buscaba era rechazar, no solo descartar, campos no declarados en el DTO, así que usé `whitelist: true` + `forbidNonWhitelisted: true`, que es lo que realmente logra eso.

## Formato uniforme de error + correlation ID

Filtro global de excepciones (`@Catch()`) + middleware que genera un `correlationId` por request (o reutiliza el del header)

## Cálculo de SLA: sin librería de fechas

Bogotá es UTC-05:00 fijo, sin horario de verano — un offset constante de 5h basta.

## Caso 4 del SLA: error del enunciado

El caso 4 (16-nov es festivo) da `18-nov 13:00`, no `17-nov 13:00` como dice el enunciado. Implementé la regla consistente con los otros 4 casos y documenté la discrepancia.

## SLA: función pura, no acoplada a Prisma

Separé el cálculo (`calculateSlaDueAt`) de la obtención del dato (`SlaService`) para poder probarlo sin Postgres ni mocks.

## Alcance del módulo de tickets

Solo CUSTOMER crea tickets. AGENT/ADMIN ven todos los tickets de su org en `GET /tickets`, no solo los asignados.

## Máquina de estados

`OPEN → IN_PROGRESS → RESOLVED → CLOSED`, con `RESOLVED → IN_PROGRESS` como única excepción. Transición inválida → 409. Ticket de otra org → 404.

## Comentarios: acceso por ticket, no por rol

Los tres roles comentan; un `findFirst` escopeado decide si pueden ver ese ticket específico.

## `useSecureFetch()` no existe

Lo reemplacé con un helper propio (`apiFetch`) que inyecta el Bearer desde la cookie httpOnly.

## Reporte de SLA

Resolución sale de `audit_log` (última transición a `RESOLVED`), no de una columna propia. Mantuve la reapertura porque el enunciado la exige. Ventana de 30 días por `created_at`.

## Scope de commits: `api`/`web`

En monorepo el scope debe decir de qué lado es el commit, no el dominio. Reescribí el historial; el commit de logout (cross-cutting) lo dividí en dos.

## Índices de BD

- `tickets(org_id)` el filtro más repetido de todo el backend.
- `tickets(agent_id)` el reporte de SLA agrupa por agente.
- `comments(ticket_id, created_at)` listado de comentarios por ticket, ordenado.
- `refresh_tokens(user_id)` — revoca la familia completa en detección de reuso, sin full scan.