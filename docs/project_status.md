# EcoTech Solutions — Estado del proyecto

> Se lee al comenzar cada sesión y se actualiza al cerrarla.

---

## 1. Resumen

| Aspecto | Estado |
|---------|--------|
| **Fase actual** | Hito 4 · Proyectos y asignaciones |
| **Progreso general** | 42 % |
| **Próximo hito** | Hito 4 · Proyectos y asignaciones |
| **Bloqueadores** | Ninguno. Hay decisiones pendientes del docente (§7) |

---

## 2. Hitos

| # | Hito | Requisitos | Estado | Fecha real |
|---|------|------------|--------|------------|
| 0 | **Documentación inicial**: visión, especificación, arquitectura, reglas del agente, seguridad de publicación | — | ✅ | 2026-09-28 |
| 1 | **Esqueleto**: Django con settings modulares y PostgreSQL, `/api/health/`, Vite + React + TS, CI de pruebas | — | ✅ | 2026-09-28 |
| 2 | **Autenticación y roles**: usuario con rol, JWT, rutas protegidas, límite de intentos | RF-01 · RF-02 | ✅ | 2026-09-28 |
| 3 | **Organización**: departamentos y empleados, con campos cifrados | RF-03 · RF-04 · RF-05 | ✅ | 2026-09-29 |
| 4 | **Proyectos y asignaciones** | RF-06 · RF-07 | 🔜 | |
| 5 | **Registro de horas**, con sus reglas | RF-08 | ⏳ | |
| 6 | **Reportes y exportación** CSV y Excel | RF-09 · RF-10 | ⏳ | |
| 7 | **Integraciones**: clima y tipo de cambio | RF-11 · RF-12 | ⏳ | |
| 8 | **Deploy** en el VPS con CI | — | ⏳ | |
| 9 | **Publicación** del repositorio | — | ✅ | 2026-09-28 |

**Leyenda:** ✅ completado · 🔄 en progreso · 🔜 próximo · ⏳ pendiente · ❌ bloqueado

---

## 3. Lo conseguido

### ✅ Hito 0 · Documentación inicial
- [x] `CLAUDE.md` adaptado del kit, con las reglas propias de un repositorio público
- [x] Especificación con los requisitos del caso resumidos y trazados a funcionalidades
- [x] Arquitectura con la ubicación de cada concepto de POO
- [x] Autenticación, roles y flujo de sesión
- [x] Permisos del agente, con la sección de publicación
- [x] Deploy público (método) y privado (operativo) separados
- [x] Variables de entorno sin valores y `.env.example`
- [x] Hooks `pre-commit` y `commit-msg`, y script de verificación de publicación
- [x] Metodología explicada para estudiantes

---

## 4. Próximos pasos · Hito 4 · Proyectos y asignaciones

| # | Tarea | Commit esperado |
|---|-------|-----------------|
| 1 | Modelo `Proyecto`: nombre, descripción, fecha de inicio, ciudad, país, coordenadas, moneda, activo | `feat(proyectos): modelo de proyecto` |
| 2 | Modelo `Asignacion` como tabla intermedia empleado ↔ proyecto, con vigencia | `feat(proyectos): asignaciones con vigencia` |
| 3 | Regla: sin dos asignaciones vigentes del mismo empleado al mismo proyecto | `feat(proyectos): una asignación vigente por empleado y proyecto` |
| 4 | Un proyecto no se elimina: se desactiva (`PROTECT` cuando tenga horas) | `feat(proyectos): desactivar en vez de eliminar` |
| 5 | API de proyectos: administración todo; gerente los de su gente; empleado los suyos | `feat(proyectos): API de proyectos con alcance por rol` |
| 6 | API de asignaciones: asignar y cerrar | `feat(proyectos): API de asignaciones` |
| 7 | Interfaz: listado y ficha del proyecto | `feat(frontend): módulo de proyectos` |
| 8 | Interfaz: asignar y desasignar empleados desde la ficha | `feat(frontend): asignaciones desde la ficha del proyecto` |

---

## 5. Riesgos

| Riesgo | Impacto | Mitigación | Estado |
|--------|---------|------------|--------|
| Filtración de un dato del servidor en un archivo o commit | Alto | `.gitignore`, hook con patrones privados, revisión del docente antes de publicar | Controlado |
| Pérdida de `FIELD_ENCRYPTION_KEY` | Alto | Respaldo en `privado/credentials.md` | Controlado |
| El repositorio sirve de plantilla para copiar en la ES4 | Medio | Caso distinto (Viajes Aventura); el código llega por hitos, no completo | Aceptado |
| Dos dominios, CORS y CSRF | Medio | Checklist de verificación del deploy | Controlado |

---

## 6. Decisiones tomadas

| Decisión | Razón |
|----------|-------|
| Nombre técnico `ecotech_demo` | Coincide con la empresa del caso. Decidido por el docente el 2026-09-28 |
| Stack C · desacoplado | La asignatura trabaja el consumo de APIs; una API propia lo muestra desde el otro lado |
| `CLAUDE.md` y `docs/` versionados | Son el material que se quiere mostrar |
| Host y usuario del servidor como secretos de GitHub | Repositorio público; desviación deliberada del kit |
| Configuración del servidor en `privado/deploy/` | Contiene rutas y nombres del servidor |
| Servicios externos sin clave de acceso | Se puede ejecutar sin registrarse en nada y no hay clave que filtrar |
| Sin exportación a PDF | Excel basta para demostrar el polimorfismo; reduce dependencias |
| Commits sin línea de coautoría de IA | Instrucción del docente; el trabajo con el agente se muestra en la documentación |
| Dominio `ecotech.antostudio.cl` y API en `ecotech-api.antostudio.cl` | Decidido por el docente el 2026-09-28. Subdominio con guion para la API, convención del kit |
| Tailwind 4 y Lucide para la interfaz | Decidido por el docente el 2026-09-28; reglas en `CLAUDE.md` §7 |
| Repositorio público desde el hito 0, con el mismo nombre de la carpeta | Decidido por el docente el 2026-09-28: el proceso se muestra a medida que ocurre |

---

## 7. Decisiones pendientes del docente

| Decisión | Opciones | Nota |
|----------|----------|------|
| **Acceso a la demostración en línea** | Cuentas de demostración de solo lectura · sin acceso público | Evita que la base se llene de datos basura |

---

## 8. Notas de sesión

### 2026-09-29 · hito 3
- Backend: modelos base abstractos, campo cifrado con Fernet, validadores, departamentos y empleados con sus reglas, APIs con alcance por rol. 58 pruebas.
- Interfaz: módulos de departamentos y empleados, con validación, búsqueda y errores de la API junto a cada campo.
- Verificado en navegador y en PostgreSQL: lo que se guarda desde el formulario queda cifrado.
- Dos defectos hallados y corregidos con su propio commit: el salario tratado como texto y el `select` que perdía su valor.

### 2026-09-28 · hito 2
- Backend: rol en el usuario, inicio de sesión con JWT, renovación rotativa en cookie HttpOnly, cierre de sesión que invalida la renovación, `/api/auth/yo/`, límite de cinco intentos por minuto y permisos por rol. 25 pruebas.
- Interfaz: sesión en memoria con renovación automática, inicio de sesión, rutas protegidas y navegación por rol.
- Verificado en navegador real: redirección, errores, sesión recuperada al recargar, permisos por rol, 375 y 1280 px, y cierre de sesión.
- Usuarios de prueba locales por rol en `privado/credentials.md`.

### 2026-09-28 · cierre del hito 1
- CI en GitHub Actions con tres trabajos —backend contra PostgreSQL 14, interfaz en Node 20.20, verificación de publicación—; verde en su primera ejecución.
- README con la ejecución local, verificado siguiendo sus pasos sobre un clon limpio.

### 2026-09-28 · hito 1
- Backend: Django 5.2 con settings por entorno, PostgreSQL local, `/api/health/` y errores uniformes. 5 pruebas en verde.
- Interfaz: Vite 8, React 19 y TypeScript 6 estricto; Tailwind 4 con tokens; Lucide; fuentes propias.
- **Tres correcciones en el camino, registradas en su propio commit:** el hook no detectaba la `SECRET_KEY` que escribe `startproject`; el usuario propio se declaró antes de migrar tras haber migrado con el estándar; sin JWT declarado, DRF respondía 403 en vez de 401.
- Pendientes del hito: tareas 9 (CI) y 10 (README de ejecución local).

### 2026-09-28
- Se generó la documentación inicial a partir del kit de inicio y del caso EcoTech Solutions
  (unidades 1 a 3 de TI3021).
- La carpeta se renombró de `echotech_demo` a `ecotech_demo`.
- Los PDF del caso quedaron en `assets/caso/`, fuera de git.
- Repositorio creado en GitHub como público, con el nombre de la carpeta.

---

*Última actualización: 2026-09-28*
