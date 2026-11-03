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
