# EcoTech Solutions — Especificación del proyecto

> Complementa a [`CLAUDE.md`](../CLAUDE.md). Resume con palabras propias los requisitos del caso
> de la asignatura TI3021 y los traduce en funcionalidades, reglas y criterios de aceptación.
> Los documentos institucionales originales no se reproducen aquí.

---

## 1. Descripción general

| | |
|---|---|
| **Proyecto** | EcoTech Solutions — Sistema de Gestión Interna |
| **Objetivo** | Reemplazar las planillas y sistemas aislados de la empresa por una aplicación única para empleados, departamentos, proyectos y horas trabajadas |
| **Principio central** | Una sola fuente de verdad, con acceso según el rol y datos personales protegidos |
| **Usuarios** | Administración de recursos humanos, gerentes de departamento y empleados |

### El problema, según el caso

| Síntoma que describe la empresa | Qué lo resuelve en el sistema |
|---|---|
| Información de empleados duplicada | Registro único con identificador automático y correo irrepetible |
| Errores al asignar personal a proyectos | Asignaciones con vigencia; no se registran horas fuera de ellas |
| Horas trabajadas sin trazabilidad | Cada registro queda ligado a empleado, proyecto, fecha y autor |
| Reportes poco confiables | Informes generados desde la base, exportables a CSV y Excel |
| Riesgo sobre datos personales | Cifrado de campos sensibles, roles y validación de entradas |
| Planificación sin considerar el clima | Pronóstico del lugar de cada proyecto (Unidad 3 del caso) |
| Pagos internacionales sin tipo de cambio | Conversión de montos con indicadores económicos (Unidad 3 del caso) |

---

## 2. Requerimientos funcionales

### 2.1 Flujo principal

1. **Administración configura la empresa**: crea departamentos y registra empleados.
2. **Asigna personas**: cada empleado a un departamento; a uno o varios proyectos.
3. **El empleado registra sus horas**: fecha, cantidad y descripción, en un proyecto asignado.
4. **El gerente revisa** las horas de su departamento y de sus proyectos.
5. **Administración genera informes** y los exporta.

### 2.2 Funcionalidades

| ID | Funcionalidad | Origen en el caso | Prioridad | Hito |
|----|---------------|-------------------|-----------|------|
| RF-01 | Iniciar y cerrar sesión con contraseña segura | Autenticación y autorización | Alta | 2 |
| RF-02 | Acceso a cada módulo según el rol | Autenticación y autorización | Alta | 2 |
| RF-03 | Crear, editar, buscar y eliminar departamentos, con su gerente | Gestión de departamentos | Alta | 3 |
| RF-04 | Registrar empleados con ID automático y datos personales | Registro de empleados | Alta | 3 |
| RF-05 | Asignar y reasignar un empleado a un departamento | Asignación a departamentos | Alta | 3 |
| RF-06 | Crear, editar y eliminar proyectos | Gestión de proyectos | Alta | 4 |
| RF-07 | Asignar y desasignar empleados a proyectos | Asignación a proyectos | Alta | 4 |
| RF-08 | Registrar horas trabajadas en un proyecto | Registro de tiempo | Alta | 5 |
| RF-09 | Informes de empleados, proyectos, departamentos y horas | Generación de informes | Media | 6 |
| RF-10 | Exportar informes a CSV y Excel | Generación de informes | Media | 6 |
| RF-11 | Consultar el clima del lugar de un proyecto | Servicios externos · clima | Media | 7 |
| RF-12 | Calcular un pago en la moneda del país del proyecto | Servicios externos · indicadores | Media | 7 |

**Fuera de alcance, deliberadamente:** exportación a PDF (el caso la menciona junto a Excel; basta
un formato de hoja de cálculo para demostrar el polimorfismo), nómina completa, aprobación de horas
en varias etapas, notificaciones por correo.

### 2.3 Módulos y campos

| Módulo | Campos | Obligatorios |
|--------|--------|--------------|
| **Departamento** | nombre, gerente | nombre |
| **Empleado** | nombre, dirección, teléfono, correo, fecha de inicio, salario, departamento | nombre, correo, fecha de inicio, salario |
| **Proyecto** | nombre, descripción, fecha de inicio, ciudad, país, latitud, longitud, moneda | nombre, fecha de inicio |
| **Asignación** | empleado, proyecto, desde, hasta | empleado, proyecto, desde |
| **Registro de tiempo** | empleado, proyecto, fecha, horas, descripción | todos |

### 2.4 Lógica de negocio

| Proceso | Regla |
|---------|-------|
| Horas de un empleado en un período | Suma de `horas` de sus registros entre dos fechas |
| Costo de un proyecto | Σ (horas del registro × salario por hora del empleado); salario por hora = salario mensual ÷ 180 |
| Pago en moneda extranjera | Monto en pesos ÷ valor de la moneda del día, según el indicador consultado |
| Alerta de clima | Se marca el proyecto si el pronóstico del día siguiente indica lluvia sobre 10 mm o viento sobre 50 km/h |

> **Decisión asumida:** el divisor de 180 horas mensuales es una simplificación didáctica
> (45 horas semanales × 4). Se declara en la interfaz junto al cálculo.

---

## 3. Especificaciones técnicas

### 3.1 Stack

Ver [`CLAUDE.md`](../CLAUDE.md) §3.

### 3.2 Contratos de datos de la API

```typescript
type Rol = 'administrador' | 'gerente' | 'empleado';

interface Departamento {
  id: number;
  nombre: string;
  gerente: number | null;          // id de Empleado
  cantidadEmpleados: number;       // calculado
}

interface Empleado {
  id: number;                      // asignado por el sistema
  nombre: string;
  correo: string;
  fechaInicio: string;             // ISO 8601: 'aaaa-mm-dd'
  departamento: number | null;
  // Solo en el detalle y solo para el administrador:
  direccion?: string;
  telefono?: string;
  salario?: number;
}

interface Proyecto {
  id: number;
  nombre: string;
  descripcion: string;
  fechaInicio: string;
  ciudad: string;
  pais: string;
  latitud: number | null;
  longitud: number | null;
  moneda: 'CLP' | 'USD' | 'EUR';
  activo: boolean;
}

interface Asignacion {
  id: number;
  empleado: number;
  proyecto: number;
  desde: string;
  hasta: string | null;            // null = vigente
}

interface RegistroTiempo {
  id: number;
  empleado: number;
  proyecto: number;
  fecha: string;
  horas: number;                   // 0,5 a 12, en múltiplos de 0,5
  descripcion: string;
}
```

> La API expone `snake_case` y la interfaz lo convierte a `camelCase` en un solo lugar
> (`frontend/src/api/`). Ninguna vista trabaja con los dos formatos.

### 3.3 Formatos y validaciones

| Campo | Formato | Ejemplo |
|-------|---------|---------|
| Correo | RFC 5322, único en el sistema | `m.rojas@ecotech.cl` |
| Teléfono | `+56 9 XXXX XXXX` | `+56 9 8765 4321` |
| Fecha en pantalla | `dd-mm-aaaa` | `28-09-2026` |
| Salario | Entero en pesos, mayor que cero | `1.250.000` |
| Horas | 0,5 a 12, en pasos de 0,5 | `7,5` |

---

## 4. Reglas de negocio

### 4.1 Validaciones

| Entidad | Regla | Mensaje |
|---------|-------|---------|
| Empleado | Correo único | «Ya existe un empleado con ese correo.» |
| Empleado | Fecha de inicio no posterior a hoy | «La fecha de inicio no puede ser futura.» |
| Departamento | Nombre único | «Ya existe un departamento con ese nombre.» |
| Departamento | El gerente pertenece al departamento | «El gerente debe ser integrante del departamento.» |
| Asignación | Sin dos asignaciones vigentes del mismo empleado al mismo proyecto | «El empleado ya está asignado a este proyecto.» |
| Registro | El empleado tiene asignación vigente en el proyecto en esa fecha | «No tiene asignación vigente en este proyecto para esa fecha.» |
| Registro | Fecha no futura | «No se pueden registrar horas en fechas futuras.» |
| Registro | Máximo 12 horas por empleado y día, sumando todos sus registros | «Supera las 12 horas diarias.» |

### 4.2 Roles y permisos

| Recurso | Administrador | Gerente | Empleado |
|---------|---------------|---------|----------|
| Departamentos | CRUD | Ver el suyo | — |
| Empleados | CRUD, con datos personales | Ver su departamento, **sin** datos personales | Ver su propia ficha |
| Proyectos | CRUD | Ver; gestionar asignaciones de su departamento | Ver los asignados |
| Registros de tiempo | Ver todos | Ver su departamento | Crear y editar los propios, hasta 7 días atrás |
| Reportes | Todos | De su departamento | — |
| Clima y tipo de cambio | Sí | Sí | Clima de sus proyectos |

---

## 5. Criterios de aceptación del proyecto

| Criterio | Cómo se verifica |
|----------|------------------|
| Cada requisito del caso tiene su funcionalidad | La tabla 2.2 completa, con hito cerrado |
| Ningún dato personal legible en la base | Consulta directa a PostgreSQL: `direccion`, `telefono` y `salario` aparecen cifrados |
| Los permisos se imponen en la API | Pruebas automáticas que llaman cada endpoint con cada rol |
| Una API externa caída no rompe el sistema | Prueba con el servicio simulado fuera de línea: la vista muestra un aviso y sigue operando |
| El repositorio público no expone nada | `scripts/verificar_publicacion.sh --todo` sin hallazgos |
| El historial es legible | Ningún commit mezcla dos cambios; el changelog registra cada hash |

---

*Última actualización: 2026-09-28*
