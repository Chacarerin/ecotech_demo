# EcoTech Solutions — Autenticación y panel de administración

> Decisiones de acceso del proyecto. Complementa la §6 de
> [`architecture.md`](architecture.md), que describe los controles técnicos.

---

## 1. Tipo de autenticación

```
[ ] Solo administrador
[x] Administrador + usuarios registrados por el administrador
[ ] Registro público
```

**Justificación.** Es un sistema interno de una empresa: **no hay registro público**. Las cuentas
las crea el administrador al dar de alta a un empleado, y cada cuenta queda ligada a una ficha de
empleado. El caso exige que cada persona acceda solo a los módulos que le corresponden, lo que
obliga a tener roles.

---

## 2. Roles

| Rol | Quién es en el caso | Acceso |
|-----|---------------------|--------|
| `administrador` | Recursos humanos | Todo, incluidos los datos personales cifrados |
| `gerente` | Gerente de un departamento | Su departamento y los proyectos donde hay gente de su departamento, sin datos personales |
| `empleado` | Cualquier trabajador | Su ficha, sus proyectos y sus horas |

El detalle recurso por recurso está en [`project_spec.md`](project_spec.md) §4.2.

**El rol es un campo del usuario, no un grupo de Django.** Tres roles fijos se leen mejor como
un `TextChoices` que como grupos con permisos configurables desde el admin, y los estudiantes
reconocen en él un atributo con dominio acotado, como en su diagrama de clases.

---

## 3. Flujo de sesión

```
 Interfaz                                   API
    │  POST /api/auth/token/ {usuario, clave}  │
    ├─────────────────────────────────────────►│  valida, aplica límite de intentos
    │◄─────────────────────────────────────────┤  200 { acceso }  +  Set-Cookie: renovación
    │                                          │     (HttpOnly · Secure · SameSite=Lax)
    │  guarda el acceso EN MEMORIA             │
    │                                          │
    │  GET /api/... Authorization: Bearer …   │
    ├─────────────────────────────────────────►│
    │                                          │
    │  401 (acceso vencido a los 15 min)       │
    │◄─────────────────────────────────────────┤
    │  POST /api/auth/token/refresh/ (cookie)  │
    ├─────────────────────────────────────────►│  rota la renovación
    │◄─────────────────────────────────────────┤  200 { acceso nuevo }
    │  reintenta la petición original          │
```

| Decisión | Razón |
|----------|-------|
| Acceso en memoria, no en `localStorage` | Un script inyectado no puede leer la memoria de otro módulo con la facilidad con que lee `localStorage` |
| Renovación en cookie `HttpOnly` | JavaScript no puede leerla; solo viaja al endpoint de renovación |
| Rotación de la renovación | Una renovación robada deja de servir en cuanto el usuario legítimo la usa |
| Acceso de 15 minutos, renovación de 8 horas | Una jornada laboral sin volver a ingresar, con exposición corta si se filtra el acceso |

---

## 4. Panel de administración

El admin de Django, en `/admin/` de la API, es el panel del desarrollador. **No se construye un
panel propio.**

| Sección | Contenido |
|---------|-----------|
| Usuarios | Cuentas, rol, activación |
| Organización | Departamentos y empleados; los campos cifrados se muestran descifrados |
| Proyectos | Proyectos y asignaciones |
| Registros | Horas, con filtros por fecha, proyecto y empleado |

---

## 5. Credenciales del administrador

| Dato | Dónde vive | ¿Git? |
|------|------------|-------|
| Usuario administrador y su contraseña | `privado/credentials.md` | **No** |
| `SECRET_KEY` y `FIELD_ENCRYPTION_KEY` | `.env` de cada entorno | **No** |

> [!CAUTION]
> **Ninguna contraseña se escribe en un archivo versionado, tampoco en una migración ni en un
> script de datos de prueba.** Los usuarios de demostración se crean con un comando de gestión que
> lee sus contraseñas del entorno y, si no están, no crea a nadie.

### Datos de demostración

El comando `python manage.py cargar_demo` crea departamentos, empleados, proyectos y horas
**ficticios** para que la aplicación no se vea vacía. Los nombres son inventados; ningún dato
corresponde a personas reales.

---

## 6. Riesgos identificados

| Riesgo | Mitigación |
|--------|------------|
| Un gerente consulta empleados de otro departamento por ID | `get_queryset()` filtrado por rol: responde 404, no 403 |
| Perder `FIELD_ENCRYPTION_KEY` deja ilegibles los datos cifrados | La clave se respalda junto a las credenciales en `privado/`; se documenta que no se rota sin migración de datos |
| La demostración pública se llena de datos basura | La instancia pública solo permite ingresar con cuentas de demostración de solo lectura (decisión pendiente, ver `project_status.md`) |
| CORS o CSRF mal configurados entre los dos dominios | Verificación explícita en el checklist de deploy |

---

*Última actualización: 2026-09-28*
