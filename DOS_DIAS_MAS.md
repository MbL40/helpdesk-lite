# Si tuviera dos días más

Con el MVP listo, usaría dos días para automatizar la calidad del código y preparar un despliegue reproducible en AWS.

## Día 1 — Automatización y calidad continua

Crearía un pipeline en **Azure Pipelines** que ejecute lint, pruebas del API y frontend, y builds de Docker. Integraría **SonarQube** con cobertura y una quality gate para detectar bugs, vulnerabilidades, code smells y duplicación. Los secretos del pipeline se guardarían en Azure, fuera del repositorio.

## Día 2 — Infraestructura reproducible en AWS

Definiría con **Terraform** la red, reglas de acceso y una instancia **AWS EC2** para desplegar la aplicación con Docker Compose. Configuraría HTTPS, gestión segura de variables y persistencia con copias de seguridad; para un uso productivo, evaluaría alojar PostgreSQL en RDS.

## Resultado esperado

El resultado sería CI con controles de calidad y cobertura, más una infraestructura inicial de AWS reproducible con Terraform. Alta disponibilidad y observabilidad quedarían como siguientes pasos según las necesidades del producto.
