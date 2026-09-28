# EcoTech Solutions — Arquitectura del sistema

> Documento de trabajo. Se actualiza cuando cambia una decisión de diseño, no cuando cambia una
> línea de código.

---

## 1. Visión general

```
                               navegador
                                   │
            ┌──────────────────────┴──────────────────────┐
            │                                             │
   Interfaz React (estáticos)                    API Django REST
   ─ React 19 + Vite + TS                        ─ gunicorn tras Nginx
   ─ TanStack Query                              ─ JWT (acceso + renovación)
   ─ token de acceso en memoria                  ─ permisos por rol
            │                                             │
            │   fetch JSON · HTTPS · CORS con lista exacta│
            └────────────────────────────────────────────►│
                                                          │
                                   ┌──────────────────────┼──────────────────────┐
                                   │                      │                      │
                             PostgreSQL 14          Open-Meteo             mindicador.cl
                         (datos personales         (clima por             (tipo de cambio)
                          cifrados con Fernet)      coordenadas)
```

> [!IMPORTANT]
> **La interfaz no decide nada que importe.** Ocultar un botón es comodidad; la seguridad está en
> la API. Todo permiso, validación y cálculo se hace en el backend, y la interfaz solo refleja el
> resultado.

---

## 2. Backend: las apps y su responsabilidad

```
backend/apps/
├── nucleo/            infraestructura común, sin lógica de negocio
│   ├── modelos.py         ModeloAuditable, Persona (abstractos)
│   ├── campos.py          CampoCifrado (encapsula Fernet)
│   ├── validadores.py     telefono_chileno, fecha_no_futura
│   ├── excepciones.py     manejador de errores de la API
│   └── views.py           /api/health/
├── usuarios/          Usuario(AbstractUser) con rol
├── organizacion/      Departamento, Empleado
├── proyectos/         Proyecto, Asignacion
├── registros/         RegistroTiempo
├── reportes/          Reporte y sus subclases · Exportador y sus subclases
└── integraciones/     ClienteApiBase · ClienteClima · ClienteIndicadores
```

**Regla de dependencias:** `nucleo` no importa a nadie; las apps de negocio importan de `nucleo`;
`reportes` e `integraciones` leen de las de negocio pero ninguna de negocio importa de ellas.

---

## 3. Dónde vive cada concepto de POO

Esta sección existe porque el repositorio es material de la asignatura. Cada concepto se aplica
donde resuelve un problema real del sistema.

### 3.1 Herencia · modelos base abstractos

```
            ModeloAuditable (abstracto)
            creado_en · modificado_en
                    ▲
        ┌───────────┼────────────┬──────────────┐
        │           │            │              │
   Persona      Departamento  Proyecto     RegistroTiempo
  (abstracto)
  nombre · correo
        ▲
        │
    Empleado
```

`abstract = True` en la clase `Meta`: Django no crea tabla para `ModeloAuditable` ni para
`Persona`; sus campos se copian a cada subclase. Es herencia de estructura sin costo en consultas.

### 3.2 Encapsulamiento · el campo cifrado

`CampoCifrado` es un campo de modelo que cifra al guardar y descifra al leer. El resto del
sistema escribe `empleado.salario = 1250000` y lee `empleado.salario` sin saber que en la base hay
un texto cifrado.

```python
class CampoCifrado(models.TextField):
    """Guarda el valor cifrado con Fernet; lo entrega descifrado."""

    def get_prep_value(self, valor):          # objeto → base de datos
        ...
    def from_db_value(self, valor, *args):    # base de datos → objeto
        ...
```

La clave vive en la variable `FIELD_ENCRYPTION_KEY`; si falta, Django no arranca. **Consecuencia
de diseño:** un campo cifrado no se puede filtrar ni ordenar en la base. Por eso el correo, que se
usa para buscar, no se cifra; la dirección, el teléfono y el salario sí.

### 3.3 Polimorfismo · informes y exportadores

```
      Reporte (abstracta)                     Exportador (abstracta)
      titulo · columnas()                     exportar(reporte) → bytes
      filas()                                 tipo_contenido · extension
         ▲                                            ▲
   ┌─────┼──────────┬─────────────┐             ┌─────┴──────┐
ReporteEmpleados  ReporteProyectos  ReporteHoras   ExportadorCSV  ExportadorExcel
```

La vista no pregunta qué informe ni qué formato: recibe uno de cada y llama
`exportador.exportar(reporte)`. Agregar PDF es una clase nueva, sin tocar las existentes.

### 3.4 Herencia con comportamiento común · clientes de API

```python
class ClienteApiBase:
    """Timeout, reintentos y traducción de errores, una sola vez."""
    url_base: str
    timeout = 5

    def _get(self, ruta, **parametros) -> dict: ...
        # requests con timeout; ante error de red o respuesta no 2xx
        # lanza ServicioExternoNoDisponible, nunca la excepción cruda

class ClienteClima(ClienteApiBase):          # Open-Meteo
    def pronostico(self, latitud, longitud) -> Pronostico: ...

class ClienteIndicadores(ClienteApiBase):    # mindicador.cl
    def valor(self, moneda, fecha) -> Decimal: ...
```

Las respuestas se guardan en caché 30 minutos (clima) y 12 horas (tipo de cambio) con el caché de
Django: no se consulta un servicio externo en cada carga de página.

### 3.5 Asociación y composición

| Relación | Tipo | En Django |
|----------|------|-----------|
| Empleado → Departamento | Asociación, multiplicidad 0..1 | `ForeignKey(null=True, on_delete=SET_NULL)` |
| Departamento → gerente | Asociación | `ForeignKey(Empleado, null=True)` |
| Empleado ↔ Proyecto | Asociación muchos a muchos con atributos | Modelo intermedio `Asignacion` |
| Proyecto ◆→ RegistroTiempo | Composición: sin proyecto no hay registro | `ForeignKey(on_delete=PROTECT)` |

> Un proyecto con horas registradas **no se elimina**: `PROTECT` lo impide y la API responde con
> un mensaje claro. Se marca inactivo. Borrar horas trabajadas destruiría la trazabilidad que el
> caso exige.

---

## 4. API REST

Prefijo `/api/`. Autenticación JWT en todo salvo `health` y `auth/token`.

| Endpoint | Métodos | Descripción |
|----------|---------|-------------|
| `/api/health/` | GET | Estado del servicio y de la base. Lo usa la verificación del deploy |
| `/api/auth/token/` | POST | Inicio de sesión: entrega acceso y deja la renovación en cookie |
| `/api/auth/token/refresh/` | POST | Renueva el acceso con la cookie |
| `/api/auth/logout/` | POST | Invalida la renovación |
| `/api/auth/yo/` | GET | Usuario actual y su rol |
| `/api/departamentos/` | GET POST | Listado y alta |
| `/api/departamentos/{id}/` | GET PUT PATCH DELETE | Detalle y edición |
| `/api/empleados/` | GET POST | Listado con búsqueda `?q=` y filtro `?departamento=` |
| `/api/empleados/{id}/` | GET PUT PATCH DELETE | Detalle; los datos cifrados solo para administrador |
| `/api/proyectos/` | GET POST | Listado y alta |
| `/api/proyectos/{id}/` | GET PUT PATCH | Detalle y edición (sin DELETE: se desactiva) |
| `/api/proyectos/{id}/clima/` | GET | Pronóstico del lugar del proyecto |
| `/api/asignaciones/` | GET POST | Asignar empleado a proyecto |
| `/api/asignaciones/{id}/` | PATCH DELETE | Cerrar o anular una asignación |
| `/api/registros/` | GET POST | Horas; el alcance depende del rol |
| `/api/registros/{id}/` | PATCH DELETE | Solo el autor, hasta 7 días |
| `/api/reportes/{tipo}/?formato=csv\|xlsx` | GET | Descarga de un informe |
| `/api/indicadores/conversion/?monto=&moneda=` | GET | Pago convertido a la moneda indicada |

### Errores

Todas las respuestas de error tienen la misma forma, y **ninguna incluye trazas ni consultas SQL**:

```json
{ "error": "validacion", "mensaje": "Supera las 12 horas diarias.", "campos": { "horas": ["..."] } }
```

| Código | Cuándo |
|--------|--------|
| 400 | Validación |
| 401 | Sin sesión o token vencido |
| 403 | Sesión válida, rol sin permiso |
| 404 | No existe **o** el rol no puede verlo (no se distingue, para no revelar existencia) |
| 409 | Conflicto: eliminar algo protegido |
| 503 | Servicio externo no disponible |

---

## 5. Frontend

```
frontend/src/
├── api/
│   ├── cliente.ts          fetch con token, renovación automática y conversión de nombres
│   └── recursos/           una función por endpoint, tipadas
├── auth/
│   ├── SesionProvider.tsx  usuario y token en memoria
│   └── RutaProtegida.tsx   exige sesión y, opcionalmente, rol
├── components/             Boton, Campo, Tabla, EstadoVacio, EstadoError, Cargando
│                           (Tailwind para estilos, Lucide para iconos)
├── features/
│   ├── empleados/          hooks, formularios y tablas del módulo
│   ├── departamentos/
│   ├── proyectos/
│   ├── horas/
│   └── reportes/
├── pages/                  una por ruta; solo componen features
└── main.tsx
```

| Estado | Dónde vive |
|--------|------------|
| Datos del servidor | TanStack Query: caché, reintentos, invalidación tras cada mutación |
| Sesión | Contexto de React, en memoria. Al recargar la página se renueva con la cookie |
| Formularios | React Hook Form con esquemas Zod que reproducen las reglas de §4.1 de la especificación |

| Estilos | Clases de Tailwind 4; los tokens de color y tipografía están en `src/index.css` (`@theme`) |
| Iconos | `lucide-react`, un icono por concepto según la tabla de `CLAUDE.md` §7 |

> Las reglas se validan **dos veces**: en Zod, para dar respuesta inmediata al usuario, y en la
> API, que es la que manda. Si difieren, gana la API.

---

## 6. Seguridad

| Amenaza | Control |
|---------|---------|
| Contraseñas débiles | Validadores de Django: longitud mínima 10, no comunes, no numéricas |
| Fuerza bruta | Límite de 5 intentos por minuto en `/api/auth/token/` (throttling de DRF) |
| Robo del token | Acceso de 15 minutos en memoria; renovación en cookie `HttpOnly`, `Secure`, `SameSite=Lax` |
| Acceso indebido entre roles | Permisos DRF por `viewset` y `get_queryset()` filtrado por rol |
| Inyección SQL | ORM de Django; ninguna consulta con cadenas concatenadas |
| XSS | React escapa por defecto; prohibido `dangerouslySetInnerHTML` |
| Datos personales expuestos en la base | `CampoCifrado` para dirección, teléfono y salario |
| Filtración de detalles internos | Manejador de excepciones propio; `DEBUG=False` en producción |
| Dependencias vulnerables | `pip-audit` y `npm audit` en la CI |

---

## 7. Pruebas

| Capa | Herramienta | Qué se prueba como mínimo |
|------|-------------|---------------------------|
| Modelos | `pytest-django` | Reglas de §4.1 de la especificación; cifrado de ida y vuelta |
| API | `pytest-django` + cliente de DRF | Cada endpoint con los tres roles: permitido y denegado |
| Integraciones | `pytest` + `responses` | Respuesta correcta, timeout y error del servicio |
| Interfaz | Vitest + Testing Library | Formularios con entradas inválidas; estados de error |

Las pruebas de la API **no llaman servicios externos reales**: se simulan.

---

*Última actualización: 2026-09-28*
