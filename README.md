# EcoTech Solutions · Sistema de Gestión Interna

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

> Las instrucciones completas se incorporan en el hito 1, cuando exista el código.
> Requisitos: Python 3.11, Node.js 20 y PostgreSQL 14.

```bash
cp .env.example .env          # completar con valores locales; nunca se versiona
git config core.hooksPath .githooks   # activa las verificaciones de cada commit
```

---

## Estado

El proyecto avanza por hitos. El detalle, con lo terminado y lo pendiente, está en
[`docs/project_status.md`](docs/project_status.md).

---

**Prof. Rubén Schnettler** · INACAP Valparaíso · 2026
Material de uso académico.
