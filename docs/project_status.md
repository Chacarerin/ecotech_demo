# EcoTech Solutions — Estado del proyecto

> Se lee al comenzar cada sesión y se actualiza al cerrarla.

---

## 1. Resumen

| Aspecto | Estado |
|---------|--------|
| **Fase actual** | Hito 0 · Documentación inicial |
| **Progreso general** | 5 % |
| **Próximo hito** | Hito 1 · Esqueleto del backend y de la interfaz |
| **Bloqueadores** | Ninguno. Hay decisiones pendientes del docente (§7) |

---

## 2. Hitos

| # | Hito | Requisitos | Estado | Fecha real |
|---|------|------------|--------|------------|
| 0 | **Documentación inicial**: visión, especificación, arquitectura, reglas del agente, seguridad de publicación | — | ✅ | 2026-09-28 |
| 1 | **Esqueleto**: Django con settings modulares y PostgreSQL, `/api/health/`, Vite + React + TS, CI de pruebas | — | 🔜 | |
| 2 | **Autenticación y roles**: usuario con rol, JWT, rutas protegidas, límite de intentos | RF-01 · RF-02 | ⏳ | |
| 3 | **Organización**: departamentos y empleados, con campos cifrados | RF-03 · RF-04 · RF-05 | ⏳ | |
| 4 | **Proyectos y asignaciones** | RF-06 · RF-07 | ⏳ | |
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

## 4. Próximos pasos · Hito 1

| # | Tarea | Commit esperado |
|---|-------|-----------------|
| 1 | Crear `backend/` con Django 5.2 y `requirements.txt` fijado | `chore(backend): crear proyecto Django` |
| 2 | Settings modulares `base` · `dev` · `prod` leyendo del `.env` | `feat(config): separar settings por entorno` |
| 3 | Conexión a PostgreSQL local y primera migración | `feat(config): conectar PostgreSQL` |
| 4 | App `nucleo` con `/api/health/` y su prueba | `feat(nucleo): endpoint de salud` |
| 5 | Manejador de errores sin detalles internos | `security(nucleo): respuestas de error uniformes` |
| 6 | `frontend/` con Vite + React + TS estricto | `chore(frontend): crear proyecto Vite` |
| 7 | Tailwind y tokens de diseño de `CLAUDE.md` §7 | `style(frontend): tokens de color y tipografía` |
| 8 | Cliente HTTP y página que consulta `/api/health/` | `feat(frontend): verificar conexión con la API` |
| 9 | Workflow de CI: pruebas y verificación de publicación | `chore(ci): pruebas en cada push` |
| 10 | Instrucciones de ejecución local en el README | `docs(readme): ejecución local` |

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
| Repositorio público desde el hito 0, con el mismo nombre de la carpeta | Decidido por el docente el 2026-09-28: el proceso se muestra a medida que ocurre |

---

## 7. Decisiones pendientes del docente

| Decisión | Opciones | Nota |
|----------|----------|------|
| **Dominio de la demostración** | Supuesto: `ecotech.rubenschnettler.cl` y `ecotech-api.rubenschnettler.cl` | Convención del kit para subdominios, igual que el blog |
| **Acceso a la demostración en línea** | Cuentas de demostración de solo lectura · sin acceso público | Evita que la base se llene de datos basura |

---

## 8. Notas de sesión

### 2026-09-28
- Se generó la documentación inicial a partir del kit de inicio y del caso EcoTech Solutions
  (unidades 1 a 3 de TI3021).
- La carpeta se renombró de `echotech_demo` a `ecotech_demo`.
- Los PDF del caso quedaron en `assets/caso/`, fuera de git.
- Repositorio creado en GitHub como público, con el nombre de la carpeta.

---

*Última actualización: 2026-09-28*
