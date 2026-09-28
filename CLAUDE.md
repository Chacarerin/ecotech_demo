# 🌱 EcoTech Solutions — Sistema de Gestión Interna

> **Este es el documento base del proyecto y el primero que lee el agente de IA en cada sesión.**
> Define qué se construye, con qué, bajo qué reglas y dónde está el detalle. Los documentos de
> `docs/` lo expanden; ninguno lo contradice.
>
> Es público a propósito: el repositorio muestra a los estudiantes de POO cómo se trabaja con un
> agente. Por eso **nada de lo que aquí se escribe puede revelar credenciales ni infraestructura**
> (ver §10).

---

## 1. Visión del proyecto

EcoTech Solutions, empresa de tecnologías sostenibles, creció rápido y administra su información
interna en planillas y sistemas aislados. El resultado: empleados duplicados, errores al asignar
personal a proyectos, horas trabajadas sin trazabilidad, reportes poco confiables y datos
personales mal protegidos.

Este sistema reemplaza esas planillas por una aplicación web con una sola fuente de verdad:
**quién trabaja en qué departamento, en qué proyectos, cuántas horas y con qué costo**, con acceso
por rol y datos personales cifrados.

> [!NOTE]
> Es un proyecto de **demostración académica**, construido sobre el caso de la asignatura
> Programación Orientada a Objeto Seguro (TI3021). Su valor está tanto en el producto como en el
> **proceso visible**: commits pequeños, documentación viva y un agente que trabaja con reglas.
> Los requisitos del caso se resumen en [`docs/project_spec.md`](docs/project_spec.md); los
> documentos institucionales originales están en `assets/caso/`, fuera de git.

---

## 2. Principios fundamentales

> [!CAUTION]
> **Obligatorios. No se negocian.**

| Principio | Descripción |
|-----------|-------------|
| **REPOSITORIO PÚBLICO, SERVIDOR PRIVADO** | Ningún archivo versionado contiene credenciales, direcciones, usuarios, rutas ni nombres del servidor. Lo operativo vive en `privado/`, fuera de git. |
| **LA POO SE TIENE QUE VER** | Cada concepto de la asignatura —encapsulamiento, herencia, polimorfismo, asociación— aparece en el código donde corresponde de verdad, no forzado. |
| **SEGURO POR DEFECTO** | Datos personales cifrados en reposo, validación de toda entrada, permisos por rol en la API y no solo en la interfaz, mensajes de error sin detalles internos. |
| **COMMITS QUE SE PUEDEN LEER** | Un commit hace una sola cosa, su título la declara y el changelog la registra con su hash. El historial es parte del material de clases. |
| **MOBILE-FIRST** | Se diseña primero para el celular. Un técnico registra sus horas desde terreno. |
| **ALCANCE ACOTADO** | Es una demostración: se implementa lo que el caso exige y se deja fuera lo que no aporta al aprendizaje. |

---

## 3. Stack tecnológico

**Stack C · Desacoplado** del kit de deploy: interfaz React compilada a estáticos y API Django
bajo gunicorn, en el mismo repositorio y el mismo VPS.

| Capa | Tecnología | Versión |
|------|------------|---------|
| Interfaz | React + Vite + TypeScript | React 19 · Vite 7 · TS 5 |
| Estilos | Tailwind CSS, con los tokens de §7 en `@theme` | 4 |
| Iconos | Lucide (`lucide-react`) | — |
| Datos en la interfaz | TanStack Query | 5 |
| Formularios | React Hook Form + Zod | — |
| API | Django + Django REST Framework | Django 5.2 LTS · DRF 3.16 |
| Autenticación | djangorestframework-simplejwt | 5 |
| Cifrado de campos | `cryptography` (Fernet) | — |
| Exportación | `openpyxl` para Excel, `csv` de la biblioteca estándar | — |
| Base de datos | PostgreSQL | **14, en todos los entornos** |
| Python | CPython | **3.11** |
| Servidor | Nginx + gunicorn + systemd | — |

**Por qué el Stack C y no el B.** El caso pide una interfaz con comportamiento de aplicación
—registro de horas en terreno, filtros, asignaciones— y la asignatura trabaja el consumo de APIs:
una API REST propia, consumida por un cliente separado, es el mismo concepto visto desde el otro
lado. El costo del stack (dos dominios, CORS, CSRF) se acepta y se documenta.

### Convenciones de nombrado

> [!CAUTION]
> **Sin excepciones.**

| Elemento | Convención | Valor |
|----------|------------|-------|
| Nombre técnico, carpeta y repositorio | `snake_case` | `ecotech_demo` |
| Entorno virtual | `<proyecto>_venv` | `ecotech_demo_venv` |
| Base de datos | `<proyecto>_db` | `ecotech_demo_db` |
| Usuario de base de datos | `<proyecto>_user` | `ecotech_demo_user` |
| Unidad systemd | `<proyecto>.service` | `ecotech_demo.service` |
| Código Python | PEP 8, `snake_case` | `fecha_inicio` |
| Código TypeScript | `camelCase`, componentes en `PascalCase` | `fechaInicio`, `TablaEmpleados` |
| Dominio del negocio | **en español** | `Empleado`, `RegistroTiempo`, `Departamento` |

> El dominio va en español porque así está escrito el caso y así lo modelaron los estudiantes en
> su diagrama UML. Los términos técnicos del framework se quedan en inglés (`serializer`, `viewset`).

### Entorno virtual (Mac)

```bash
mkvirtualenv ecotech_demo_venv -p python3.11   # una vez
workon ecotech_demo_venv                       # cada sesión
```

---

## 4. Estructura del proyecto

```
ecotech_demo/
├── backend/                       # API Django
│   ├── config/
│   │   ├── settings/
│   │   │   ├── base.py            # común; lee todo del .env
│   │   │   ├── dev.py             # DEBUG=True, PostgreSQL local
│   │   │   └── prod.py            # DEBUG=False, seguridad HTTPS
│   │   ├── urls.py
│   │   └── wsgi.py
│   ├── apps/
│   │   ├── nucleo/                # modelos base abstractos, cifrado, validadores, health
│   │   ├── usuarios/              # Usuario personalizado con rol
│   │   ├── organizacion/          # Departamento, Empleado
│   │   ├── proyectos/             # Proyecto, Asignacion
│   │   ├── registros/             # RegistroTiempo
│   │   ├── reportes/              # informes y exportadores (polimorfismo)
│   │   └── integraciones/         # clientes de clima y tipo de cambio
│   ├── manage.py
│   └── requirements.txt
│
├── frontend/                      # Interfaz React
│   ├── src/
│   │   ├── api/                   # cliente HTTP y funciones por recurso
│   │   ├── auth/                  # contexto de sesión y rutas protegidas
│   │   ├── components/            # componentes reutilizables
│   │   ├── features/              # una carpeta por módulo del negocio
│   │   ├── hooks/
│   │   └── pages/
│   └── package.json
│
├── docs/                          # 📚 documentación de trabajo · PÚBLICA
├── scripts/                       # verificación de publicación y utilidades
├── .githooks/                     # pre-commit y commit-msg
├── .github/workflows/             # CI y deploy (desde el hito 8)
├── .env.example                   # variables sin valores reales
├── CLAUDE.md                      # 📖 este documento · PÚBLICO
├── README.md
│
├── privado/                       # 🔒 NO GIT · deploy real, credenciales, patrones prohibidos
├── proyecto_generico/             # 🔒 NO GIT · kit con el inventario real del servidor
└── assets/                        # 🔒 NO GIT · documentos institucionales del caso
```

> [!CAUTION]
> **Diferencia con los demás proyectos del kit.** Normalmente `CLAUDE.md` y `docs/` no se
> versionan. Aquí sí, porque son el material que se quiere mostrar. La consecuencia es que todo
> dato operativo que el kit pondría en `docs/` —guía de deploy real, credenciales— se escribe en
> `privado/`.

---

## 5. Entornos y variables

Settings modulares en `backend/config/settings/`, secretos solo en `.env`. La lista completa de
variables, con su propósito y dónde vive cada una, está en
[`docs/variables_entorno.md`](docs/variables_entorno.md). **Los valores reales están en
`privado/credentials.md`**, nunca en un archivo versionado.

```bash
# Desarrollo local
DJANGO_SETTINGS_MODULE=config.settings.dev python manage.py runserver
DJANGO_SETTINGS_MODULE=config.settings.dev python manage.py migrate
```

> [!WARNING]
> Las variables `VITE_*` se compilan dentro del bundle y son **públicas por diseño**. Nunca se
> pone una credencial en una variable `VITE_*`.

---

## 6. Deploy

> [!IMPORTANT]
> **Dos documentos, dos audiencias.**
>
> | Documento | Qué contiene | ¿Git? |
> |-----------|--------------|-------|
> | [`docs/deploy.md`](docs/deploy.md) | El método explicado: flujo, etapas, verificación, rollback. Sin datos del servidor | Sí |
> | `privado/deploy.md` | La guía operativa real, generada con `proyecto_generico/deploy/02_generar_docs.md` | **No** |
>
> Antes de cualquier tarea de deploy, el agente lee `privado/deploy.md` y
> `proyecto_generico/deploy/00_servidor.md`. Los datos se copian de ahí, nunca de memoria.

El invariante del kit se mantiene: push a `main` → GitHub Actions → SSH con clave restringida →
`deploy.sh` en el servidor → verificación con `curl`.

**Única desviación deliberada respecto del kit:** en este repositorio el host y el usuario del
servidor van como **secretos de GitHub** (`VPS_HOST`, `VPS_USER`) y no como literales en el
workflow. El kit los considera datos no secretos, y tiene razón en general; aquí se ocultan porque
el repositorio es público y material de clases, y no corresponde exhibir la puerta de entrada de
un servidor que aloja sitios de terceros.

> [!CAUTION]
> **Los archivos del servidor —server blocks de Nginx, unidad systemd, `deploy.sh`— viven en
> `privado/deploy/`**, no en `deploy/` ni en `scripts/` como indica el kit. Contienen rutas y
> nombres del servidor.

---

## 7. Diseño

Estética limpia de producto de gestión, asociada a sostenibilidad sin caer en lo decorativo.

| Regla | Descripción |
|-------|-------------|
| **Tema claro por defecto** | Herramienta de oficina y de terreno; se lee a pleno sol. Tema oscuro opcional |
| **Datos antes que adornos** | Tablas legibles, cifras alineadas a la derecha, fechas en formato `dd-mm-aaaa` |
| **Estados siempre visibles** | Carga, vacío y error en cada vista que consulta la API |
| **Acción primaria al alcance del pulgar** | En móvil, «Registrar horas» fija en la parte inferior |
| **Accesibilidad** | Contraste AA, foco visible, etiquetas en todos los campos |
| **Solo Tailwind** | Estilos con clases utilitarias de Tailwind. Nada de CSS suelto por componente ni estilos en línea; lo repetido se extrae a un componente, no a una clase CSS |
| **Iconos de Lucide, con significado** | Un icono ayuda a distinguir, no decora. Siempre acompañado de texto, salvo en botones de solo icono, que llevan `aria-label` |

### Paleta · tokens de Tailwind 4

Tailwind 4 se configura en CSS, no en `tailwind.config.js`. Los tokens viven en
`frontend/src/index.css` y generan clases como `bg-fondo`, `text-acento` o `border-borde`:

```css
@import "tailwindcss";

@theme {
  --color-fondo: #F7F9F8;
  --color-tarjeta: #FFFFFF;
  --color-acento: #0F766E;          /* verde azulado: acción principal */
  --color-acento-hover: #115E59;
  --color-positivo: #65A30D;        /* verde lima: estados positivos */
  --color-peligro: #B91C1C;
  --color-texto: #1F2937;
  --color-texto-secundario: #4B5563;
  --color-texto-tenue: #6B7280;
  --color-borde: #E5E7EB;

  --font-sans: "Inter", system-ui, sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, monospace;
}
```

> Un color que no esté en `@theme` no se usa. Si hace falta uno nuevo, se agrega aquí primero,
> con su propósito comentado.

### Iconografía · Lucide

| Regla | Valor |
|-------|-------|
| Biblioteca | `lucide-react`, importando cada icono por nombre: `import { Users } from 'lucide-react'` |
| Tamaño | 20 px en texto y botones, 24 px en la navegación inferior |
| Trazo | `strokeWidth={1.75}` en todo el sistema |
| Color | Hereda del texto (`currentColor`): el icono nunca lleva un color propio |
| Accesibilidad | Decorativo junto a texto: `aria-hidden`. Botón de solo icono: `aria-label` obligatorio |

**Un icono por concepto, el mismo en toda la aplicación:**

| Concepto | Icono |
|----------|-------|
| Panel | `LayoutDashboard` |
| Empleados | `Users` |
| Departamentos | `Building2` |
| Proyectos | `FolderKanban` |
| Horas | `Clock` |
| Reportes | `BarChart3` |
| Clima | `CloudSun` |
| Tipo de cambio | `ArrowLeftRight` |
| Exportar | `Download` |
| Cerrar sesión | `LogOut` |

| Uso | Fuente | Peso |
|-----|--------|------|
| Títulos y texto | Inter | 400 · 600 · 700 |
| Cifras e identificadores | JetBrains Mono | 500 |

---

## 8. Estructura de la aplicación

| Ruta | Página | Acceso |
|------|--------|--------|
| `/ingresar` | Inicio de sesión | Público |
| `/` | Panel: horas de la semana, proyectos activos, alertas de clima | Todos |
| `/empleados` | Listado, alta, edición y búsqueda | Administrador |
| `/departamentos` | Listado, alta, edición y gerente | Administrador |
| `/proyectos` | Listado, detalle, asignaciones, clima del lugar | Administrador · Gerente |
| `/horas` | Registro y consulta de horas trabajadas | Todos, con alcance por rol |
| `/reportes` | Informes y exportación a CSV o Excel | Administrador · Gerente |

```
┌──────────────────────────────────────────────┐
│  EcoTech        Panel  Proyectos  Horas   👤 │  ← barra superior (desktop)
├──────────────────────────────────────────────┤
│                                              │
│               contenido de la vista          │
│                                              │
├──────────────────────────────────────────────┤
│  Panel  Proyectos  Horas  Reportes  Más      │  ← navegación inferior (móvil), iconos Lucide
└──────────────────────────────────────────────┘
```

---

## 9. Modelo de datos

| Entidad | Descripción | Campos clave |
|---------|-------------|--------------|
| **Usuario** | Cuenta de acceso, con rol | `username`, `rol` (administrador · gerente · empleado) |
| **Departamento** | Unidad de la empresa | `nombre`, `gerente` → Empleado |
| **Empleado** | Persona contratada | `id` autogenerado, `nombre`, `correo`, `fecha_inicio`, `departamento`; **cifrados:** `direccion`, `telefono`, `salario` |
| **Proyecto** | Iniciativa de la empresa | `nombre`, `descripcion`, `fecha_inicio`, `ciudad`, `pais`, `latitud`, `longitud`, `moneda` |
| **Asignacion** | Empleado ↔ Proyecto, muchos a muchos | `empleado`, `proyecto`, `desde`, `hasta` |
| **RegistroTiempo** | Horas trabajadas | `empleado`, `proyecto`, `fecha`, `horas`, `descripcion` |

Reglas del caso que el modelo impone, no la interfaz:

- Un empleado pertenece a **un solo departamento a la vez**.
- Un empleado puede estar en **varios proyectos**; solo registra horas en los que tiene asignación vigente.
- El identificador del empleado **se asigna automáticamente**.

El detalle —herencia, métodos, validaciones— está en [`docs/architecture.md`](docs/architecture.md).

### Integraciones externas

| Servicio | Propósito | Clave |
|----------|-----------|-------|
| **Open-Meteo** | Clima del lugar de cada proyecto, para planificar | No requiere |
| **mindicador.cl** | Tipo de cambio para calcular pagos en la moneda del país | No requiere |

Se eligieron servicios **sin clave de acceso** a propósito: el repositorio es público y los
estudiantes pueden ejecutarlo sin registrarse en nada.

---

## 10. Lineamientos obligatorios para el agente

> [!CAUTION]
> **Reglas que no se rompen.**

### 🔒 Repositorio público

1. **Nunca** se escribe en un archivo versionado: direcciones IP, nombres de equipo, usuarios del
   servidor, rutas del servidor, nombres de claves SSH, contraseñas, `SECRET_KEY`, claves de
   cifrado ni tokens. Tampoco en mensajes de commit.
2. Si un dato operativo hace falta, va a `privado/` y el documento público lo menciona en
   abstracto: «el servidor», «el usuario de despliegue».
3. El hook `pre-commit` corre `scripts/verificar_publicacion.sh`. **Si rechaza un commit, se
   corrige el archivo; nunca se usa `--no-verify`.**
4. Los documentos institucionales del caso (`assets/caso/`) no se copian al repositorio. Se
   resumen con palabras propias en `docs/project_spec.md`.
5. Detalle y lista de verificación en [`docs/seguridad_publicacion.md`](docs/seguridad_publicacion.md).

### ✍️ Commits

- Formato `tipo(scope): descripción`, en español, título de 72 caracteres como máximo. Lo valida
  el hook `commit-msg`.
- **Un commit, un cambio.** Mejor cinco commits pequeños que uno que mezcla modelo, vista y estilos.
- **Sin líneas de coautoría automática** (`Co-Authored-By` de herramientas de IA). El autor es el
  docente; el trabajo con el agente se documenta en este archivo y en `docs/`, que es donde un
  estudiante puede verlo y aprender de él. El hook `commit-msg` lo rechaza.
- Después de cada commit con código, se registra en `docs/changelog.md` con su hash corto.
- Reglas completas en [`docs/agent_permissions.json`](docs/agent_permissions.json).

### 🗣️ Idioma y tono

- **Con Rubén, español de Chile con `tú`**: «tienes», «revisa», «¿lo hacemos?». Nada de
  rioplatense (`vos`, `tenés`, `dale`) ni de españolismos (`vale`, `ordenador`).
- **El agente se refiere a sí misma en femenino**: «quedé lista», «estoy segura». Registro directo
  y técnico, sin adular.
- **Todo lo que leen los estudiantes** —README, `docs/metodologia.md`, mensajes de la interfaz—
  va en español neutro y formal, sin tuteo.
- Términos técnicos en inglés cuando son el nombre real (`commit`, `deploy`, `build`); el dominio
  del negocio en español.

### 🛑 Fuera de lo documentado: parar y consultar

Si el proyecto necesita algo que no esté en `proyecto_generico/deploy/stacks/` —Redis, Celery,
WebSockets, contenedores— el agente **no improvisa**: lo plantea y espera la decisión.

### Backend

| ✅ Hacer | ❌ No hacer |
|----------|-------------|
| Permisos por rol en cada `viewset` | Confiar en que la interfaz oculta el botón |
| Validar en el `serializer` y en el modelo | Validar solo en el formulario de React |
| Cifrar `direccion`, `telefono` y `salario` al guardar | Guardar datos personales en texto plano |
| Errores de API con mensaje genérico y código | Devolver la traza de Python al cliente |
| Timeouts y manejo de fallas en toda llamada externa | Que una API caída tumbe una vista |
| PostgreSQL en todos los entornos | SQLite «solo para probar» |
| `CORS_ALLOWED_ORIGINS` con la lista exacta | `*` en producción |

### Frontend

| ✅ Hacer | ❌ No hacer |
|----------|-------------|
| Componentes pequeños, una responsabilidad | Componentes de 500 líneas |
| TypeScript estricto | `any` |
| Estados de carga, vacío y error siempre | Pantallas que quedan en blanco |
| Token de acceso en memoria | Tokens en `localStorage` |
| Lógica de datos en hooks con TanStack Query | `fetch` repetido en cada componente |

---

## 11. Tareas atómicas y sesiones

```
Al iniciar sesión                   Al cerrar sesión
─────────────────                   ─────────────────
1. Leer docs/project_status.md      1. Commit de lo pendiente, en estado funcional
2. git log --oneline -10            2. Registrar hashes en docs/changelog.md
3. Continuar desde el último        3. Actualizar docs/project_status.md
   checkpoint                       4. Push
```

Una tarea grande se divide en pasos que terminan en un commit funcional: modelo → migración →
`serializer` → `viewset` → prueba → interfaz. **Nunca se deja código a medias entre sesiones.**

---

## 12. Checklist de una funcionalidad terminada

- [ ] Cumple el requisito del caso que la originó (`docs/project_spec.md`)
- [ ] Permisos verificados con un usuario de cada rol
- [ ] Entradas inválidas rechazadas con mensaje claro
- [ ] Estados de carga, vacío y error en la interfaz
- [ ] Funciona en 320 px de ancho, sin desplazamiento horizontal
- [ ] Pruebas del backend en verde
- [ ] `scripts/verificar_publicacion.sh --todo` sin hallazgos
- [ ] Changelog con hash y `project_status.md` actualizados

---

## 🗺️ Mapa de documentación

> [!TIP]
> **No leas todo.** Consulta solo lo que la tarea necesita.

| Si vas a… | Consulta primero | Luego, si hace falta |
|-----------|------------------|----------------------|
| Retomar el trabajo | `docs/project_status.md` | `docs/changelog.md` |
| Implementar una funcionalidad | este archivo | `docs/project_spec.md`, `docs/architecture.md` |
| Tocar autenticación o permisos | `docs/authentication.md` | — |
| Hacer commit | `docs/agent_permissions.json` | `docs/seguridad_publicacion.md` |
| Desplegar | `privado/deploy.md` | `proyecto_generico/deploy/` |
| Agregar una variable de entorno | `docs/variables_entorno.md` | `privado/credentials.md` |
| Trabajar la interfaz | §7 de este archivo (tokens e iconos) | `proyecto_generico/skills/skill_frontend.md`, `skill_responsive_design.md` |
| Patrones de React | `proyecto_generico/skills/skill_react_best_practices.md` (~80 KB, solo si hace falta) | — |

---

*Última actualización: 2026-09-28*
