# EcoTech Solutions — Changelog

> Historial de cambios del proyecto. **Cada entrada lleva el hash corto del commit** que la
> introdujo: con `git show <hash>` se ve exactamente qué cambió.
>
> Formato de versiones: [SemVer](https://semver.org/lang/es/). Categorías: Añadido, Cambiado,
> Corregido, Eliminado, Seguridad.

---

## [Sin publicar]

### Próximo
- Hito 2 · autenticación y roles. Plan de commits en [`project_status.md`](project_status.md) §4.

---

## [0.2.0] - 2026-09-28 · Hito 1 · Esqueleto

Backend y interfaz conectados, con pruebas y CI desde el primer día. Tres errores se detectaron en
el camino, y cada corrección quedó explicada en el cuerpo de su commit: la clave que escribe
`startproject` no la detectaba el hook (`c87db27`), el usuario propio se declaró después de migrar
(`7bab437`) y, sin JWT declarado, la API respondía 403 en vez de 401 (`2900814`).

### Añadido
- `[ad2b91e]` chore(backend): crear el proyecto Django con dependencias fijadas
- `[3172dcb]` feat(config): separar settings por entorno y leerlos del .env
- `[23bbec0]` test(config): configurar pytest sobre PostgreSQL
- `[2f10b4a]` feat(nucleo): endpoint de salud que verifica la base de datos
- `[1c78369]` chore(frontend): crear la interfaz con Vite, React y TypeScript estricto
- `[690cacf]` style(frontend): tokens de Tailwind 4, fuentes propias e iconos Lucide
- `[7849cab]` feat(frontend): cliente HTTP y verificación de conexión con la API
- `[87c3664]` chore(ci): pruebas, build y verificación de publicación en cada push

### Seguridad
- `[c87db27]` security(repo): detectar claves de Django escritas en el código
- `[2900814]` security(nucleo): respuestas de error uniformes y sin detalles internos

### Corregido
- `[7bab437]` fix(usuarios): declarar el usuario propio antes de migrar

### Documentación
- `[f00838e]` docs(readme): ejecución local paso a paso, verificada desde cero

---

## [0.1.1] - 2026-09-28 · Publicación y decisiones de diseño

El repositorio se publicó en GitHub con el mismo nombre de la carpeta. Se fijaron el dominio de la
demostración y la base visual de la interfaz.

### Cambiado
- `[8b53135]` docs(estado): registrar la publicación del repositorio
- `[1644c90]` docs(diseno): fijar Tailwind 4 y Lucide como base de la interfaz
- `[062efc7]` docs(deploy): fijar el dominio en antostudio.cl
- `[dec2b5b]` docs(agente): declarar que el scope del commit va sin tildes ni eñe

---

## [0.1.0] - 2026-09-28 · Hito 0 · Documentación inicial

El primer bloque de trabajo no contiene código: define qué se construye, cómo y bajo qué reglas,
antes de escribir la primera línea.

### Añadido
- `[81b24a4]` docs(readme): presentar el proyecto y su propósito académico
- `[51d35b2]` docs(agente): documento base del proyecto para el agente de IA
- `[9503aa8]` docs(spec): trazar los requisitos del caso a funcionalidades
- `[5e412a6]` docs(arquitectura): capas, API y ubicación de cada concepto de POO
- `[a1fa4d9]` docs(auth): roles, flujo de sesión y manejo de credenciales
- `[2d2ee5f]` docs(permisos): límites del agente y reglas de publicación
- `[9ed887a]` docs(deploy): explicar el método de publicación sin exponer el servidor
- `[28f336a]` docs(entorno): lista de variables y plantilla sin valores
- `[0c50841]` docs(seguridad): reglas de un repositorio público
- `[3a61c6b]` docs(metodologia): explicar el método de trabajo a los estudiantes
- `[1c80b6a]` docs(estado): hitos, decisiones tomadas y próximos pasos

### Seguridad
- `[a84b004]` chore(repo): excluir credenciales, servidor e insumos privados
- `[e5a52cc]` security(repo): verificar datos sensibles antes de cada commit

### Decisiones técnicas
- Stack C · desacoplado: React + Vite + TypeScript, Django REST, PostgreSQL 14, VPS propio.
- `CLAUDE.md` y `docs/` se versionan: son el material que el repositorio quiere mostrar.
- Los datos operativos del servidor y las credenciales viven en una carpeta privada fuera de git.
- Servicios externos sin clave de acceso (Open-Meteo y mindicador.cl).

---

## Plantilla para nuevas entradas

```markdown
## [X.Y.Z] - AAAA-MM-DD · Hito N · Nombre

### Añadido
- `[hash]` tipo(scope): descripción
```

```bash
git log -1 --format="%h"     # hash corto del último commit
git log --oneline -10        # los últimos diez
```
