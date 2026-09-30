# EcoTech Solutions — Changelog

> Historial de cambios del proyecto. **Cada entrada lleva el hash corto del commit** que la
> introdujo: con `git show <hash>` se ve exactamente qué cambió.
>
> Formato de versiones: [SemVer](https://semver.org/lang/es/). Categorías: Añadido, Cambiado,
> Corregido, Eliminado, Seguridad.

---

## [Sin publicar]

### Próximo
- Hito 5 · registro de horas. Plan en [`project_status.md`](project_status.md) §4.

---

## [0.7.0] - 2026-09-30 · Identidad visual y tema oscuro

La interfaz deja de verse como una plantilla: paleta propia en dos temas, tipografías con carácter,
un panel de entrada por rol y la hoja de ruta a la vista. La API responde solo JSON en producción.

### Añadido
- `[f57d246]` feat(frontend): identidad visual propia y tema oscuro
- `[5672e8e]` feat(frontend): panel de entrada por rol con hoja de ruta
- `[eb8053b]` feat(frontend): ingreso en dos columnas y cuentas de demo compactas

### Cambiado
- `[6fdeea3]` feat(auth): diez intentos de inicio de sesión por minuto
- `[b29e57e]` feat(config): la API responde solo JSON en producción

### Decisiones y hallazgos
- **La interfaz navegable de DRF no va a producción.** Es la página «de Django» que aparecía al
  abrir la API en el navegador. En desarrollo ayuda a aprender; en producción expone rutas y
  formularios a cualquiera, y ningún cliente real la usa. Un servicio real responde JSON, y en su
  raíz, a lo sumo, su nombre y dónde consultar su estado.
- **Un límite por IP choca con un laboratorio**, que sale a internet con una sola dirección. Se
  subió de 5 a 10 intentos por minuto.
- **Nunca `text-white` sobre el acento:** en el tema oscuro el acento es claro. Se creó
  `sobre-acento`, y se reemplazó en todos los botones.
- **El tema se aplica desde un archivo, no desde un script en línea:** la CSP del sitio los
  bloquea, y es correcto que lo haga.
- La hoja de ruta del panel se mantiene a mano: la regla quedó en `CLAUDE.md` §7.

---

## [0.6.1] - 2026-09-30 · Cuentas de demostración

Una cuenta pública por rol en la pantalla de ingreso, con lo que cada uno puede hacer, para que
cualquiera compare los tres recorridos. 89 pruebas del backend.

### Añadido
- `[32aa282]` feat(nucleo): portada de la API en la raíz del dominio
- `[03b9753]` feat(nucleo): cuentas de demostración por rol y restablecimiento
- `[bae4309]` feat(frontend): cuentas de demostración en la pantalla de ingreso

### Decisiones y hallazgos
- **Publicar una credencial a propósito exige decir por qué y con qué resguardos.** Las cuentas
  no entran al panel de Django, los datos y las claves se reponen cada noche, y solo existen donde
  se activan con una variable. La excepción quedó escrita en `variables_entorno.md`.
- La raíz de la API respondía 404 y parecía una caída: ahora orienta hacia `/api/health/`.

---

## [0.6.0] - 2026-09-30 · Hito 8, adelantado · En línea

La aplicación se publica antes de completar los hitos 5 a 7, por decisión del docente: se muestra
ya y se sigue mejorando en línea. Desde ahora cada push a `main` con la CI en verde llega solo al
servidor. 85 pruebas del backend.

### Añadido
- `[0851f03]` feat(nucleo): datos ficticios del caso para demostración
- `[07f0e71]` `deploy.yml`: deploy automático tras la CI en verde, con una clave que solo puede ejecutar el
  script de deploy

### Corregido
- `[4414a04]` fix(proyectos): pruebas sin fechas fijas que caducan
- `[95e7d97]` fix(deploy): una sola conexión SSH desde la Action

### Decisiones y hallazgos
- **Una prueba con una fecha escrita a mano es una prueba con fecha de vencimiento.** Dos pruebas
  cerraban una asignación el 29-09-2026; al día siguiente la regla del modelo las rechazó, con
  razón. Las fechas relativas a «hoy» se calculan, no se escriben.
- **La configuración del servidor también se revisa antes de usarla.** La política de seguridad de
  contenido de la interfaz solo permitía conexiones al propio dominio, y la API vive en otro: el
  inicio de sesión habría fallado en producción. Además, en Nginx un `add_header` dentro de un
  `location` anula los del bloque superior, y `index.html` quedaba sin cabeceras de seguridad.
  Ninguna prueba automática lo habría detectado: se encontró leyendo la configuración.
- El primer deploy automático falló con «Connection reset»: el servidor limita las conexiones SSH
  seguidas y `ssh-keyscan` abre varias antes de la real. Se adoptó la acción que ya usan los demás
  proyectos del mismo servidor, con una sola conexión (`95e7d97`).
- Lo que requiere privilegios en el servidor se reunió en un solo script que ejecuta el docente;
  el agente trabaja con una cuenta sin privilegios.

---

## [0.5.0] - 2026-09-29 · Hito 4 · Proyectos y asignaciones

Proyectos con ubicación y moneda, y asignaciones como tabla intermedia con vigencia entre empleado
y proyecto. Un proyecto no se elimina: se desactiva. El gerente asigna solo a la gente de su
departamento, y el backend lo verifica aunque la interfaz no le muestre a nadie más. 84 pruebas.

### Añadido
- `[27e86c4]` feat(proyectos): modelo de proyecto con ubicación y moneda
- `[c448433]` feat(proyectos): asignaciones como tabla intermedia con vigencia
- `[e0e48bf]` feat(proyectos): una asignación vigente por empleado y proyecto
- `[2b08d77]` feat(proyectos): desactivar en vez de eliminar
- `[e3ce630]` feat(proyectos): API de proyectos con alcance por rol
- `[b2e75d3]` feat(proyectos): API de asignaciones, con el gerente limitado a su gente
- `[5f2e0b7]` feat(frontend): módulo de proyectos
- `[0acbf55]` feat(frontend): asignaciones desde la ficha del proyecto

### Seguridad
- `[a8856b4]` security(organizacion): un gerente sin departamento no ve nada

### Corregido
- `[9a3f9b7]` fix(frontend): los errores 4xx se muestran sin reintentar
- `[d7d373a]` fix(proyectos): el gerente ve los proyectos activos

### Decisiones y hallazgos
- **Un filtro por `None` es una fuga, no un filtro vacío** (`a8856b4`). Un gerente sin
  departamento filtraba por `departamento_id = None`; Django lo traduce a `IS NULL` y, al cruzar
  tablas, le mostraba los registros sin departamento. Ahora el alcance del gerente pasa por una
  sola función que devuelve una consulta vacía, y hay pruebas de regresión en los cuatro recursos.
- **Una regla de alcance demasiado estricta también es un defecto** (`d7d373a`). La API mostraba al
  gerente solo los proyectos donde ya trabajaba su gente, y así nunca podía asignar a la primera
  persona. Las pruebas pasaban porque probaban lo que se había programado, no lo que decía la
  especificación. Lo detectó el recorrido en el navegador.
- El manejador de errores reemplazaba el mensaje específico de un `PermissionDenied` por el
  genérico; ahora conserva el que escribe la vista (`b2e75d3`).
- La interfaz reintentaba tres veces un 404 y quedaba en «Cargando…»: un error 4xx no se arregla
  reintentando (`9a3f9b7`).
- Cerrar una asignación con fecha de hoy la deja vigente hasta el fin del día: la persona trabajó
  ese día y debe poder registrar sus horas.

---

## [0.4.0] - 2026-09-29 · Hito 3 · Organización

Departamentos y empleados, con dirección, teléfono y salario cifrados en la base. Aquí aparecen
juntos los conceptos de la asignatura: herencia en los modelos base, encapsulamiento en el campo
cifrado y asociaciones entre empleado, departamento y gerente. 58 pruebas del backend.

### Añadido
- `[7a7be86]` feat(nucleo): modelos base abstractos ModeloAuditable y Persona
- `[1e58f10]` feat(nucleo): validadores de teléfono chileno y fecha no futura
- `[6074d2c]` feat(organizacion): departamentos y empleados con datos cifrados
- `[04e3072]` feat(organizacion): reglas de negocio del caso validadas al guardar
- `[aa6f83f]` feat(organizacion): API de departamentos con alcance por rol
- `[ce52e9c]` feat(organizacion): API de empleados con datos personales por rol
- `[1d67b37]` feat(frontend): módulo de departamentos
- `[775e644]` feat(frontend): módulo de empleados

### Seguridad
- `[383457f]` security(nucleo): campo cifrado para los datos personales

### Corregido
- `[134a27b]` fix(frontend): el select no pierde su valor si la lista llega tarde

### Decisiones y hallazgos
- `ModeloAuditable` valida al guardar: la API REST no aplica las reglas del modelo por su cuenta.
- El plan tenía un commit solo de pruebas; cada regla y cada permiso se probó en el commit que lo
  introdujo.
- Una prueba detectó que DRF trataba el salario cifrado como texto y respondía 500 (`ce52e9c`).
- Una captura detectó que editar un empleado podía sacarlo de su departamento (`134a27b`). Ninguna
  prueba lo habría visto: dependía del orden en que llegan las respuestas.
- Los dos hallazgos quedaron como reglas en `CLAUDE.md`.

---

## [0.3.0] - 2026-09-28 · Hito 2 · Autenticación y roles

Sesión con JWT: el acceso vive en memoria y la renovación en una cookie que JavaScript no puede
leer. Tres roles con permisos que decide la API. 25 pruebas del backend y el recorrido completo
verificado en un navegador real.

### Añadido
- `[6a9905a]` feat(usuarios): rol del usuario con tres valores fijos
- `[895834b]` feat(auth): inicio de sesión con JWT y renovación en cookie HttpOnly
- `[51f41f2]` feat(auth): renovar y cerrar sesión desde la cookie
- `[35a5370]` feat(auth): endpoint del usuario actual
- `[9d52a99]` feat(nucleo): permisos por rol reutilizables, con su matriz de pruebas
- `[9ca3327]` feat(frontend): sesión en memoria con renovación automática
- `[f834137]` feat(frontend): página de inicio de sesión y ruta protegida
- `[09c3843]` feat(frontend): navegación por rol y rutas de los módulos

### Seguridad
- `[c426192]` security(auth): cinco intentos de inicio de sesión por minuto

### Decisiones y hallazgos
- React Router 8 exige Node 22.22 y el servidor tiene 20.20: se fijó la versión 7 y `engine-strict`
  hace que la CI detecte cualquier dependencia incompatible con el servidor.
- El plan tenía un commit de pruebas por rol aparte; la matriz de permisos lo cubrió en `9d52a99`.
- Una captura de pantalla detectó un color de texto bajo el contraste AA; quedó como regla en `CLAUDE.md`.

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
