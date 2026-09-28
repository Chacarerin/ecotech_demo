# EcoTech Solutions · Sistema de Gestión Interna

[![CI](https://github.com/Chacarerin/ecotech_demo/actions/workflows/ci.yml/badge.svg)](https://github.com/Chacarerin/ecotech_demo/actions/workflows/ci.yml)

Aplicación web de demostración para la gestión de empleados, departamentos, proyectos y horas
trabajadas de **EcoTech Solutions**, el caso de la asignatura **Programación Orientada a Objeto
Seguro (TI3021)** de INACAP Valparaíso.

> **Propósito académico.** Este repositorio no es una solución de las evaluaciones: es un ejemplo
> de **cómo se trabaja un proyecto de software de principio a fin**. Se construye a la vista, con
> commits pequeños, documentación que evoluciona junto al código y un agente de inteligencia
> artificial que trabaja bajo reglas escritas y revisión humana.

---

## Qué muestra este repositorio

| Práctica | Dónde verla |
|---|---|
| La documentación se escribe **antes** que el código | `CLAUDE.md` y `docs/`, que existen desde el primer commit |
| Cada commit hace una sola cosa y lo declara en su título | `git log --oneline` |
| Cada cambio queda registrado con el identificador de su commit | [`docs/changelog.md`](docs/changelog.md) |
| El estado del proyecto se puede retomar en cualquier sesión | [`docs/project_status.md`](docs/project_status.md) |
| El agente de IA trabaja con instrucciones y límites explícitos | [`CLAUDE.md`](CLAUDE.md) y [`docs/agent_permissions.json`](docs/agent_permissions.json) |
| Un repositorio público no expone credenciales ni infraestructura | [`docs/seguridad_publicacion.md`](docs/seguridad_publicacion.md) |
| El método de trabajo, explicado para quien lo quiera replicar | [`docs/metodologia.md`](docs/metodologia.md) |

---

## Stack

| Capa | Tecnología |
|---|---|
| Interfaz | React 19 + Vite + TypeScript |
| Estilos e iconos | Tailwind CSS 4 + Lucide |
| API | Django 5 + Django REST Framework |
| Base de datos | PostgreSQL 14 |
| Servidor | VPS propio con Nginx y gunicorn, publicación continua desde `main` |

```
   Navegador ──► Interfaz React (archivos estáticos)
       │
       └──────► API Django REST ──► PostgreSQL
                     │
                     └──► Servicios externos: clima y tipo de cambio
```

---

## Relación con la asignatura

El sistema implementa los requisitos del caso EcoTech Solutions y hace visibles los conceptos de
programación orientada a objetos en un proyecto real.

| Concepto | Dónde aparece en el sistema |
|---|---|
| **Clases y objetos** | Cada entidad del dominio —empleado, departamento, proyecto, registro de horas— es una clase de modelo |
| **Encapsulamiento** | Los datos sensibles del empleado se cifran al guardarse y solo se leen a través de sus métodos |
| **Herencia** | Modelos base abstractos que comparten campos de auditoría y datos de persona |
| **Polimorfismo** | Los exportadores de informes —CSV y Excel— responden al mismo mensaje `exportar()` |
| **Asociación y composición** | Empleado–departamento, empleado–proyecto y registro de horas–proyecto |
| **Consumo de servicios externos** | Clientes de API que heredan de una clase base con manejo de errores común |
| **Seguridad** | Autenticación, roles, validación de entradas y cifrado de datos personales |

---

## Ejecución local

**Requisitos:** Python 3.11, Node.js 20.19 o superior y PostgreSQL 14.

### 1. Clonar y activar las verificaciones

```bash
git clone https://github.com/Chacarerin/ecotech_demo.git
cd ecotech_demo
git config core.hooksPath .githooks     # revisa cada commit antes de aceptarlo
```

### 2. Base de datos

Cree un usuario y una base propios del proyecto. El permiso `CREATEDB` es necesario porque las
pruebas crean y destruyen su propia base temporal.

```bash
psql -d postgres -c "CREATE USER ecotech_demo_user WITH PASSWORD 'una-clave-local' CREATEDB;"
psql -d postgres -c "CREATE DATABASE ecotech_demo_db OWNER ecotech_demo_user;"
```

### 3. Backend

```bash
cd backend
python3.11 -m venv .venv && source .venv/bin/activate
pip install -r requirements-dev.txt
```

Cree `backend/.env` a partir de la sección **BACKEND** de [`.env.example`](.env.example), con la
clave de base de datos del paso 2. Genere la `SECRET_KEY` con el comando que indica el propio
archivo. **El `.env` nunca se sube al repositorio.**

```bash
python manage.py migrate
python -m pytest                # las pruebas deben pasar antes de continuar
python manage.py runserver      # API en http://localhost:8000
```

Compruebe en `http://localhost:8000/api/health/` que responde `{"estado": "ok", "base": "ok"}`.

### 4. Interfaz

En otra terminal:

```bash
cd frontend
npm install
npm run dev                     # interfaz en http://localhost:5173
```

La página inicial muestra **«Servidor en línea · base de datos conectada»** cuando la interfaz,
la API y la base se comunican entre sí.

### Problemas frecuentes

| Síntoma | Causa |
|---|---|
| `Falta la variable de entorno SECRET_KEY` | No existe `backend/.env`, o le falta esa línea |
| `permission denied to create database` al correr las pruebas | El usuario de PostgreSQL no tiene `CREATEDB` |
| La interfaz dice «No fue posible conectar con el servidor» | El backend no está corriendo en el puerto 8000 |
| El commit es rechazado por el hook | Se preparó un archivo con un dato sensible; ver [`docs/seguridad_publicacion.md`](docs/seguridad_publicacion.md) |

---

## Estado

El proyecto avanza por hitos. El detalle, con lo terminado y lo pendiente, está en
[`docs/project_status.md`](docs/project_status.md).

---

**Prof. Rubén Schnettler** · INACAP Valparaíso · 2026
Material de uso académico.
