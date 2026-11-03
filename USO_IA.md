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

## Módulo de autenticación (JWT, guards, refresh token rotativo)

**Contexto:** decidí el diseño de seguridad antes de pedir código — argon2id, access +
refresh con rotación, Bearer header. Al releer el enunciado completo confirmé que el
token no puede ser accesible desde JS del navegador; ajusté el transporte: Bearer solo
entre Nuxt y el API, nunca expuesto al navegador.

**Uso de IA:** generé con IA el módulo completo (DTOs, AuthService, AuthController,
JwtStrategy, guards, decorators)

**Qué corregí:** un error de TypeScript en JwtStrategy (`process.env.JWT_SECRET` es
`string | undefined`) — lo resolví con un helper `requireEnv()` que falla explícito, en
vez de forzar el tipo con `!`. Verifiqué el flujo completo con curl real: login, refresh,
reuso de un token ya rotado, y rechazo de campos no declarados en el body.

**Qué detectó la IA:** `whitelistStrict`, la opción que pide el enunciado para
`ValidationPipe`, no existe en NestJS ni en `class-validator` — se verificó contra los
`.d.ts` reales y se usó la configuración equivalente real (`whitelist` +
`forbidNonWhitelisted`).

## Formato uniforme de error

El filtro de excepciones y el middleware de correlation ID. Al aplicarlos se perdió la carga de `.env` en `main.ts` — lo detecté porque el backend no arrancaba.

## Módulo de tickets

El SLA, la máquina de estados, `assign` y comentarios, con las decisiones tomadas de antemano. Verifiqué el caso 4 del SLA a mano, reapliqué el endpoint de `assign` que se revirtió por error, y registré el módulo de comentarios que había quedado sin conectar. Probé la condición de carrera con dos peticiones en paralelo reales.

## Reporte de SLA

La consulta SQL. Corregí un bug de zona horaria (UTC vs Bogotá) verificándolo con fechas de prueba calculadas a mano antes de confiar en el resultado.

## Integración del frontend (BFF, Tailwind, logout)

Las rutas proxy de Nitro, el middleware de auth, los estilos y el logout. Corregí un middleware mal nombrado (nunca se aplicaba) y un error de tipos en `apiFetch`.