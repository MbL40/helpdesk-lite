# Decisiones

## Dependencias — versiones fijas sin excepción (`--save-exact`)

Todas las dependencias y devDependencies se fijan a versión exacta, sin rangos `^` ni `~`, incluyendo herramientas de desarrollo. Esto va más allá de lo que garantiza `package-lock.json` + `npm ci`: protege específicamente el momento en que un desarrollador corre `npm install` localmente para agregar un paquete nuevo, que puede regenerar el lock y resolver una versión distinta a la probada — incluyendo una versión comprometida en un ataque de cadena de suministro (mantenedor comprometido publicando una versión maliciosa como patch/minor, que un rango `^` instalaría automáticamente).