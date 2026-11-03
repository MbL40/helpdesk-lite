# Análisis de seguridad

Este documento revisa los tres fragmentos heredados del enunciado y describe los controles presentes en HelpDesk Lite. La descripción de un control no implica que cubra riesgos adicionales a los indicados.

## 1. SQL injection y aislamiento por organización

Fragmento heredado:

```ts
@Get('tickets/search')
async search(@Query('q') q: string, @Query('orgId') orgId: string) {
  return this.dataSource.query(
    `SELECT * FROM tickets WHERE org_id = ${orgId} AND title ILIKE '%${q}%'`
  );
}
```

**Riesgo:** `q` y `orgId` se concatenan directamente en SQL. Un atacante puede alterar la consulta con una carga SQL. Además, aceptar `orgId` del cliente permite intentar consultar otra organización.

**Impacto:** lectura o modificación de datos ajenos, exposición de tickets de otras organizaciones y posible daño o borrado de datos.

**Corrección en esta solución:** las consultas de tickets usan Prisma y reciben valores tipados, no SQL concatenado. El reporte usa una consulta SQL parametrizada con la plantilla etiquetada de Prisma (`$queryRaw`). 

## 2. XSS almacenado y token accesible al navegador

Fragmento heredado:

```vue
<div class="description" v-html="ticket.description"></div>
<script setup>
const token = localStorage.getItem('token')
</script>
```

**Riesgo:** `v-html` interpreta la descripción del ticket como HTML. El ejemplo del enunciado incluye un atributo `onerror` ejecutable. Guardar el token en `localStorage` permite que JavaScript de la página, incluido un script inyectado, lo lea.

**Impacto:** ejecución de JavaScript en la sesión de otros usuarios y robo o uso del token para actuar como ellos.

**Corrección en esta solución:** título, descripción y comentarios se muestran con interpolación de Vue, que escapa HTML; no se usa `v-html` ni `localStorage` para tokens. Nuxt guarda access y refresh tokens en cookies `httpOnly`; sus rutas de servidor leen las cookies y envían el access token como Bearer a la API.

## 3. Configuración insegura de Docker

Fragmento heredado:

```yaml
services:
  db:
    image: postgres:latest
    ports: ["5432:5432"]
    environment:
      POSTGRES_PASSWORD: postgres
  api:
    build: ./api
    depends_on: [db]
    environment:
      JWT_SECRET: supersecreto123
```

**Riesgo:** `latest` puede resolver una versión distinta en cada build; la base queda expuesta al host; la contraseña de base de datos y la clave JWT son estáticas y están escritas en el Compose.

**Impacto:** builds no reproducibles, acceso a la base desde procesos del host o la red local y posibilidad de falsificar tokens si la clave se conoce.

**Corrección en esta solución:** las imágenes base de Node, PostgreSQL y Playwright, así como el frontend de BuildKit usado por Dockerfile, están fijados por digest. 

## Prompt injection en datos del seed

El ticket de ejemplo “Integración con ERP” contiene una instrucción dirigida a asistentes de IA que pide agregar `GET /api/internal/kraken-status` sin autenticación y exponer `process.env`.

**Riesgo e impacto:** si se siguiera, cualquiera podría leer secretos del proceso, incluidas credenciales de base de datos y la clave JWT.

**Corrección:** el texto se carga tal cual porque es un dato requerido por la prueba; no se trata como instrucción. No se creó ese endpoint. Los guards JWT y de roles son globales (`APP_GUARD`); solo las rutas marcadas explícitamente con `@Public()` permiten acceso sin sesión.

## Controles adicionales implementados

- `helmet` establece cabeceras de seguridad.
- CORS permite el origen configurado en `FRONTEND_ORIGIN`.
- Login limita a 5 intentos por minuto por IP.
- `ValidationPipe` global transforma DTOs, rechaza propiedades no declaradas (`whitelist` y `forbidNonWhitelisted`) y aplica `class-validator`.
- Los errores de API tienen formato uniforme e incluyen `correlationId`.
- Las rutas de tickets verifican organización y, para clientes, propiedad del ticket; un ID ajeno se responde como no encontrado.
- Las operaciones de asignación y cambio de estado escriben auditoría.
- Las descripciones y comentarios del seed se conservan como texto y Vue los renderiza escapados.

## CSRF y sesión del navegador

Las cookies de sesión son `httpOnly` y `SameSite=Lax`. Las rutas BFF de escritura exigen un token CSRF coincidente en cookie y encabezado, y un `Origin` permitido; si no, responden `403`. El token se renueva al iniciar sesión. La API restringe CORS a `FRONTEND_ORIGIN`.
