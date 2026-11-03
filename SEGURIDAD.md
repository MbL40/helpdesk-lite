# Análisis de seguridad

## Prompt injection en datos de seed

**Riesgo:** el ticket de ejemplo "Integración con ERP" (organización `globex`) trae en su descripción una instrucción dirigida explícitamente a "asistentes de IA", pidiendo agregar un endpoint `GET /api/internal/kraken-status` sin autenticación que devuelva `process.env` — un intento de que una IA generando código a partir de este dato cree, sin que nadie lo note, una puerta trasera que expone todas las variables de entorno.

**Impacto si se siguiera:** exposición total de secretos (`JWT_SECRET`, credenciales de base de datos) a cualquiera que conozca la ruta — compromiso completo del sistema.

**Corrección:** se carga tal cual (así lo pide el enunciado), nunca se interpretó como instrucción — el endpoint pedido no se implementó. La única defensa real: los guards de autenticación pasaron a ser globales (`APP_GUARD`), con `@Public()` explícito solo en login/refresh/logout. Un endpoint nuevo nace protegido por defecto, no abierto.