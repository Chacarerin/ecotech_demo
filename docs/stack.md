# EcoTech Solutions — Stack tecnológico

> Qué tecnologías usa el proyecto, en qué versión exacta y **por qué cada una**. Elegir una
> dependencia es una decisión técnica: cada línea de esta tabla responde a una necesidad del caso.
>
> Las versiones se leen de los archivos que las fijan: [`backend/requirements.txt`](../backend/requirements.txt)
> y [`frontend/package.json`](../frontend/package.json). Si esta tabla y esos archivos difieren,
> mandan los archivos.

---

## 1. Arquitectura en una línea

**Aplicación desacoplada:** una interfaz React compilada a archivos estáticos y una API Django REST
que es la única que habla con la base de datos. Dos subdominios, un mismo repositorio.

```
   Navegador ──► Interfaz React (archivos estáticos, Nginx)
       │
       └──────► API Django REST (gunicorn detrás de Nginx) ──► PostgreSQL 14
                     │
                     └──► Servicios externos: clima y tipo de cambio (hito 7)
```

---

## 2. Backend · Python

**Python 3.11.** Todas las versiones están **fijadas** con `==`: el servidor instala exactamente lo
que se probó en desarrollo y en la CI.

| Paquete | Versión | Para qué | Por qué este |
|---------|---------|----------|--------------|
| `Django` | 5.2.17 | Marco web: modelos, ORM, administración | Versión **LTS**, con soporte de seguridad hasta 2028. El ORM genera consultas parametrizadas |
| `djangorestframework` | 3.18.1 | La API REST: serializadores, vistas, permisos | El estándar para APIs en Django; permisos por vista y límites de intentos incluidos |
| `djangorestframework_simplejwt` | 5.5.1 | Autenticación con JWT | Rotación de la renovación y lista negra sin programarlas desde cero |
| `django-cors-headers` | 4.9.0 | Permite que la interfaz, en otro dominio, llame a la API | Lista exacta de orígenes, nunca `*` |
| `psycopg[binary]` | 3.3.6 | Conexión con PostgreSQL | La versión 3 del conector oficial |
| `python-dotenv` | 1.2.3 | Carga `backend/.env` en las variables de entorno | Parametriza la configuración sin escribir secretos en el código |
| `cryptography` | 50.0.1 | Cifrado Fernet de los datos personales | Biblioteca de referencia en Python; Fernet autentica además de cifrar |
| `gunicorn` | 26.2.0 | Servidor de aplicaciones en producción | Ejecuta varios procesos de Django detrás de Nginx |

**Solo para desarrollo y CI** —[`backend/requirements-dev.txt`](../backend/requirements-dev.txt)—:

| Paquete | Versión | Para qué |
|---------|---------|----------|
| `pytest` | 9.1.1 | Ejecutar las pruebas |
| `pytest-django` | 4.14.0 | Base de datos de prueba y cliente de la API dentro de pytest |

**Planificado** para el hito 6: `openpyxl`, para exportar informes a Excel. El CSV usa el módulo
`csv` de la biblioteca estándar y no agrega dependencias.

### Instalación

```bash
python3.11 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt                 # desde la raíz: remite a backend/requirements.txt
pip install -r backend/requirements-dev.txt     # para ejecutar las pruebas
```

---

## 3. Frontend · TypeScript

**Node.js 20.19 o superior**, exigido con `engine-strict` en `frontend/.npmrc`: con una versión
anterior, `npm install` se detiene en vez de instalar algo que después falla.

| Paquete | Versión | Para qué | Por qué este |
|---------|---------|----------|--------------|
| `react` · `react-dom` | 19 | La interfaz | La biblioteca de interfaz más usada en la industria |
| `vite` | 8 | Compila y sirve la interfaz en desarrollo | Arranque inmediato; genera archivos estáticos con nombre único por versión |
| `typescript` | 6 | Tipos estáticos | Detecta errores antes de ejecutar; los tipos de la API quedan documentados en el código |
| `react-router` | 7 | Navegación entre páginas | La versión 8 exige Node 22, que el servidor no tiene |
| `@tanstack/react-query` | 5 | Pide datos a la API y los mantiene en caché | Estados de carga y error sin programarlos en cada página |
| `react-hook-form` · `zod` · `@hookform/resolvers` | 7 · 4 · 5 | Formularios y su validación | La validación de la interfaz es una comodidad; la que decide está en el backend |
| `tailwindcss` · `@tailwindcss/vite` | 4 | Estilos | Clases utilitarias; los colores de los dos temas son tokens en `src/index.css` |
| `lucide-react` | 1 | Iconos | Iconos como componentes, con licencia libre |
| `@fontsource-variable/*` | 5 | Tipografías Instrument Sans, Bricolage Grotesque y JetBrains Mono | Se sirven desde el propio sitio: sin depender de un servidor externo de fuentes |

**Solo para desarrollo:** `oxlint` (análisis del código), `@vitejs/plugin-react` y los tipos de
React y de Node.

### Instalación

```bash
cd frontend
npm install
npm run dev          # http://localhost:5173
```

> A diferencia de Python, las versiones del frontend se declaran con `^` en `package.json`, pero
> **las exactas quedan fijadas en `package-lock.json`**, que se versiona. `npm ci` instala
> exactamente esas.

---

## 4. Datos y servidor

| Pieza | Versión | Para qué |
|-------|---------|----------|
| **PostgreSQL** | **14**, en todos los ambientes | Base de datos. La misma versión en desarrollo, en la CI y en el servidor: un defecto no puede aparecer solo en producción por diferencia de versión |
| **Nginx** | La del sistema | Sirve la interfaz, termina HTTPS y reenvía a gunicorn |
| **systemd** | La del sistema | Mantiene gunicorn en ejecución y lo reinicia si se detiene |
| **Let's Encrypt** (Certbot) | — | Certificados HTTPS gratuitos, renovados automáticamente |

---

## 5. Herramientas del proceso

| Herramienta | Para qué | Dónde |
|-------------|----------|-------|
| **Git** con hooks propios | Rechazar un commit con credenciales o con un título mal formado | [`.githooks/`](../.githooks) |
| **GitHub Actions · CI** | Pruebas del backend contra PostgreSQL 14, análisis y compilación de la interfaz, verificación de publicación | [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) |
| **GitHub Actions · Deploy** | Publica en el servidor solo lo que pasó la CI | [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml) |
| **Mermaid** | Diagramas UML escritos como texto, que GitHub dibuja | [`uml.md`](uml.md) |
| **Agente de IA** | Programa bajo reglas escritas y revisión humana | [`CLAUDE.md`](../CLAUDE.md) |

---

## 6. Servicios externos · hito 7

| Servicio | Para qué | Por qué este |
|----------|----------|--------------|
| **Open-Meteo** | Clima del lugar de un proyecto | Gratuito y **sin clave de acceso**: no hay credencial que filtrar |
| **mindicador.cl** | Valor del dólar y del euro en pesos chilenos | Gratuito, sin clave y con datos del Banco Central de Chile |

---

*Última actualización: 2026-09-30*
