# EcoTech Solutions — Seguridad de la aplicación

> Cómo se protege el sistema, capa por capa, y **por qué** cada control está donde está. Cada
> afirmación de este documento remite al archivo del repositorio que la implementa: la seguridad
> se verifica en el código, no se declara.
>
> La protección del repositorio público —qué no se publica y cómo se impide— está en
> [`seguridad_publicacion.md`](seguridad_publicacion.md). El flujo de sesión, en detalle, en
> [`authentication.md`](authentication.md).

---

## 1. El principio: defensa en profundidad

Ningún control es suficiente por sí solo. Si uno falla, el siguiente contiene el daño. Un ejemplo
del propio sistema: aunque la interfaz no le muestre a un gerente los empleados de otro
departamento, la API tampoco se los entrega, y si los pidiera por su número, la API respondería
que no existen.

| Capa | Qué protege | Sección |
|------|-------------|---------|
| Configuración | Que ninguna clave quede escrita en el código | 2 |
| Consultas a la base | Que un dato ingresado no se ejecute como instrucción SQL | 3 |
| Autenticación | Que quien entra sea quien dice ser | 4 |
| Autorización | Que cada rol vea y haga solo lo que le corresponde | 5 |
| Datos personales | Que la base, por sí sola, no revele dirección, teléfono ni salario | 6 |
| Validación | Que ningún dato inválido llegue a guardarse | 7 |
| Errores | Que una falla no revele detalles internos | 8 |
| Transporte y navegador | Que la comunicación no se lea ni se manipule | 9 |
| Servidor | Que una clave robada no permita más que lo estrictamente necesario | 10 |

---

## 2. Parametrización de la configuración

**Regla:** el código no contiene ningún valor que cambie entre ambientes ni ningún secreto. Todo lo
que depende de dónde se ejecuta la aplicación se lee de **variables de entorno**, cargadas desde un
archivo `.env` que no se versiona.

### 2.1 Cómo se lee una variable

[`backend/config/settings/base.py`](../backend/config/settings/base.py) define dos funciones:

```python
def obligatoria(nombre: str) -> str:
    """Lee una variable que debe existir. Si falta, Django no arranca."""
    valor = os.environ.get(nombre)
    if not valor:
        raise RuntimeError(f"Falta la variable de entorno {nombre}. Revise backend/.env.")
    return valor

def lista(nombre: str, por_defecto: str = "") -> list[str]:
    """Lee una variable con valores separados por comas."""
    return [v.strip() for v in os.environ.get(nombre, por_defecto).split(",") if v.strip()]

SECRET_KEY = obligatoria("SECRET_KEY")
FIELD_ENCRYPTION_KEY = obligatoria("FIELD_ENCRYPTION_KEY")
ALLOWED_HOSTS = lista("ALLOWED_HOSTS", "localhost,127.0.0.1")
```

**Una variable secreta no tiene valor por omisión.** Si falta, la aplicación **no arranca**. Es
preferible una falla visible al iniciar que una aplicación en producción funcionando con una clave de
ejemplo que alguien copió de un tutorial.

### 2.2 Tres archivos de configuración, uno por ambiente

| Archivo | Cuándo se usa | Qué agrega |
|---------|---------------|------------|
| `settings/base.py` | Siempre | Lo común: aplicaciones, base de datos, JWT, CORS, límites |
| `settings/dev.py` | Desarrollo local | `DEBUG`, interfaz navegable de DRF |
| `settings/prod.py` | Servidor | HTTPS obligatorio, cookies seguras, HSTS, solo JSON |

La variable `DJANGO_SETTINGS_MODULE` decide cuál se carga. El mismo código corre en los dos
ambientes; cambia la configuración, no el programa.

### 2.3 Qué es secreto y qué no

| Tipo | Ejemplos | Dónde vive |
|------|----------|------------|
| **Secreto** | `SECRET_KEY`, `DB_PASSWORD`, `FIELD_ENCRYPTION_KEY` | `.env` del servidor, con permisos `600`, y un respaldo fuera del repositorio |
| **Configuración** | `ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS`, `JWT_ACCESO_MINUTOS` | `.env`, pero publicarla no es un riesgo |
| **Pública por naturaleza** | `VITE_API_URL`, `VITE_DEMO` | `frontend/.env.production`. Se compila dentro del JavaScript que descarga cualquier visitante |

> [!WARNING]
> **Toda variable `VITE_*` es pública**, aunque el archivo `.env` no se versione: Vite la copia
> dentro del código que recibe el navegador. Nunca se pone una clave en una variable `VITE_*`.

El catálogo completo, con el valor de cada variable en cada ambiente, está en
[`variables_entorno.md`](variables_entorno.md). La CI usa valores **desechables**, escritos a la
vista en [`.github/workflows/ci.yml`](../.github/workflows/ci.yml): solo existen dentro de la máquina
temporal de GitHub. Los datos reales del servidor son **secretos del repositorio** en GitHub y
nunca aparecen en un archivo.

---

## 3. Consultas parametrizadas: la defensa contra la inyección SQL

La **inyección SQL** ocurre cuando un dato ingresado por el usuario se pega dentro de una
instrucción SQL y la base lo ejecuta como parte de ella.

```python
# ❌ Vulnerable: el texto del usuario se vuelve parte de la instrucción
q = request.GET["q"]                      # el atacante escribe:  ' OR '1'='1
cursor.execute(f"SELECT * FROM proyecto WHERE nombre = '{q}'")
# La base recibe:  SELECT * FROM proyecto WHERE nombre = '' OR '1'='1'  → todas las filas
```

La defensa es la **consulta parametrizada**: la instrucción y los datos viajan **por separado**. La
base compila primero la instrucción, con un marcador en el lugar del dato, y después recibe el dato
como valor. Por mucho que contenga comillas, nunca se interpreta como SQL.

```python
# ✅ Parametrizada: %s es un marcador, y el dato viaja aparte
cursor.execute("SELECT * FROM proyecto WHERE nombre = %s", [q])
```

**En este proyecto no se escribe SQL a mano.** El ORM de Django construye consultas parametrizadas
siempre. El filtro de búsqueda de proyectos, en
[`backend/apps/proyectos/views.py`](../backend/apps/proyectos/views.py):

```python
if texto := self.request.query_params.get("q", "").strip():
    consulta = consulta.filter(Q(nombre__icontains=texto) | Q(ciudad__icontains=texto))
```

genera `... WHERE nombre ILIKE %s OR ciudad ILIKE %s`, con `texto` como parámetro. La única
instrucción escrita a mano en todo el backend es `SELECT 1`, en la verificación de salud, y no
recibe ningún dato.

> [!IMPORTANT]
> **Regla del proyecto:** prohibido `.raw()`, `.extra()` y `cursor.execute()` con cadenas
> formateadas (`f""`, `%`, `+`, `.format()`). Si algún día se necesita SQL propio, se usa el
> segundo argumento de `execute()` para los datos.

---

## 4. Autenticación: quién entra

| Control | Implementación | Por qué |
|---------|----------------|---------|
| Contraseñas robustas | Validadores de Django: mínimo 10 caracteres, no comunes, no solo números, no parecidas al usuario | Una contraseña débil anula todo lo demás |
| Contraseñas nunca en claro | Django guarda un **resumen** con PBKDF2 y sal propia por usuario | Una copia de la base no entrega ninguna contraseña |
| Token de acceso breve | JWT de **15 minutos**, guardado **solo en memoria** del navegador | Si se roba, sirve poco tiempo; al recargar la página desaparece |
| Renovación protegida | Cookie `ecotech_renovacion`: `HttpOnly`, `Secure`, `SameSite=Lax`, ruta `/api/auth/` | JavaScript no puede leerla, y el resto de la API nunca la recibe |
| Renovación rotativa | Cada uso entrega una nueva e **invalida la anterior** (lista negra) | Una renovación robada deja de servir en cuanto el usuario legítimo la usa |
| Límite de intentos | **10 inicios de sesión por minuto** por dirección IP | Frena la fuerza bruta. Se subió de 5 porque un laboratorio completo sale a internet con una sola IP |
| Sin enumeración de usuarios | «Usuario o clave incorrectos», sin distinguir cuál falló | No revela qué cuentas existen |

La configuración está en [`settings/base.py`](../backend/config/settings/base.py) (`SIMPLE_JWT`,
`COOKIE_RENOVACION`, `DEFAULT_THROTTLE_RATES`) y en
[`frontend/src/api/cliente.ts`](../frontend/src/api/cliente.ts), que guarda el token en una
variable del módulo y no en `localStorage`.

> [!NOTE]
> **Límite conocido:** el contador de intentos vive en la memoria de cada proceso de gunicorn. Con
> tres procesos, el límite efectivo llega a 30 por minuto. Sigue frenando un ataque automatizado, y
> evita instalar Redis en un servidor que no lo tiene. Es un riesgo aceptado y declarado.

---

## 5. Autorización: qué puede hacer cada rol

Autenticar dice **quién** es el usuario; autorizar decide **qué** puede hacer. Son dos preguntas
distintas y se responden en lugares distintos.

### 5.1 Dos niveles de control

| Nivel | Pregunta | Dónde |
|-------|----------|-------|
| **Permiso** | ¿Este rol puede hacer esta operación? | `get_permissions()` de cada vista, con las clases de [`apps/nucleo/permisos.py`](../backend/apps/nucleo/permisos.py) |
| **Alcance** | ¿Sobre qué registros? | `get_queryset()` de cada vista: la consulta ya viene filtrada por rol |

La tabla de permisos por rol es la de [`project_spec.md`](project_spec.md) §4.2. Las pruebas se
escriben **contra esa tabla**, no contra lo que se programó.

### 5.2 Lo que no se puede ver, no existe

Si un gerente pide un empleado de otro departamento por su número, la API responde **404**, no 403.
Un 403 confirmaría que ese registro existe; un 404 no revela nada.

### 5.3 La interfaz no es un control de seguridad

Ocultar un botón no impide la operación: cualquiera puede llamar a la API directamente. Por eso toda
restricción se verifica **en el backend**, aunque la interfaz ya la aplique. Ejemplo, en
[`apps/proyectos/views.py`](../backend/apps/proyectos/views.py):

```python
def perform_create(self, serializer):
    empleado = serializer.validated_data["empleado"]
    # El gerente asigna solo a su gente: se verifica aunque la interfaz no le muestre a otros
    if usuario.es_gerente and empleado.departamento_id != departamento_de(usuario):
        raise PermissionDenied("Solo puede asignar empleados de su departamento.")
```

### 5.4 Dos hallazgos que dejaron regla

| Hallazgo | Qué pasaba | Regla que quedó |
|----------|------------|-----------------|
| **Un filtro por `None` es una fuga** | Un gerente sin departamento filtraba por `departamento_id = None`; Django lo traduce a `IS NULL` y le mostraba los registros sin departamento | El alcance del gerente pasa por **una sola función**, que devuelve una consulta vacía si no hay departamento. Hay pruebas de regresión en los cuatro recursos |
| **Un alcance demasiado estrecho también es un defecto** | El gerente no veía los proyectos donde aún no trabajaba su gente, y nunca podía asignar a la primera persona | Se prueba contra la especificación, no contra el código |

### 5.5 Mínimo privilegio también en los datos

El gerente ve a su gente **sin** dirección, teléfono ni salario: la vista elige un serializador
distinto según el rol (`EmpleadoSerializer` frente a `EmpleadoDetalleSerializer`). El dato no se
oculta en la pantalla: **no sale de la API**.

---

## 6. Datos personales cifrados en la base

La dirección, el teléfono y el salario se guardan **cifrados** con Fernet (AES-128 con
autenticación), mediante `CampoCifrado`, en
[`apps/nucleo/campos.py`](../backend/apps/nucleo/campos.py). Quien obtenga una copia de la base, un
respaldo o acceso de solo lectura a PostgreSQL, ve texto ilegible.

```
   empleado.salario = 1250000        ← el código trabaja con el valor real
            │ get_prep_value()  cifra
            ▼
   gAAAAABm…Xk2Q==                    ← lo que queda en la base
            │ from_db_value()   descifra
            ▼
   empleado.salario → 1250000
```

| Decisión | Razón |
|----------|-------|
| El correo **no** se cifra | Se usa para buscar y debe ser único: un valor cifrado no se puede filtrar ni ordenar en la base |
| La clave vive fuera del código | `FIELD_ENCRYPTION_KEY`, obligatoria. Sin ella, Django no arranca |
| La clave **no se regenera** | Con otra clave, los datos ya cifrados quedan ilegibles para siempre. Tiene respaldo fuera del servidor |

Es el ejemplo de **encapsulamiento** del proyecto: el resto del sistema no sabe que el dato está
cifrado. Ver [`architecture.md`](architecture.md) §3.2.

---

## 7. Validación: el backend decide

La interfaz valida con `zod` para dar una respuesta inmediata, pero **esa validación es una
comodidad, no un control**: se puede saltar llamando a la API directamente. La que decide está en el
backend, en dos capas:

| Capa | Qué valida | Dónde |
|------|-----------|-------|
| Serializador | Tipos, campos obligatorios, formato | `serializers.py` de cada app |
| **Modelo** | Las reglas de negocio del caso | `clean()` de cada modelo |

`ModeloAuditable` ejecuta `full_clean()` **en cada guardado**
([`apps/nucleo/models.py`](../backend/apps/nucleo/models.py)). Así, una regla del caso —un gerente
pertenece a su departamento, una asignación no termina antes de empezar— se cumple venga el dato de
donde venga: la API, el panel de administración o un script.

---

## 8. Errores sin detalles internos

Un mensaje de error puede revelar la estructura interna: nombres de tablas, rutas del servidor,
versiones. El manejador propio,
[`apps/nucleo/excepciones.py`](../backend/apps/nucleo/excepciones.py), responde **siempre con la
misma forma** y sin rastros técnicos:

```json
{ "error": "validacion", "mensaje": "Los datos enviados no son válidos.", "campos": { "salario": ["El salario debe ser mayor que cero."] } }
```

En producción `DEBUG=False`: un error no controlado responde 500 con un mensaje genérico, y el
detalle queda en el registro del servidor, no en la respuesta.

**La API responde solo JSON en producción.** La interfaz navegable de DRF, útil para aprender en
desarrollo, se retira en `prod.py`: le mostraría a cualquiera las rutas y formularios para probarlas.

---

## 9. Transporte y navegador

| Control | Qué hace | Dónde |
|---------|----------|-------|
| **HTTPS obligatorio** | Todo HTTP se redirige a HTTPS; certificados de Let's Encrypt | Nginx y `SECURE_SSL_REDIRECT` en `prod.py` |
| **HSTS** | Ordena al navegador no volver a usar HTTP | API: `SECURE_HSTS_SECONDS` en `prod.py`. Interfaz: pendiente (§12) |
| **CORS con lista exacta** | Solo `https://ecotech.antostudio.cl` puede llamar a la API desde un navegador. Nunca `*` | `CORS_ALLOWED_ORIGINS` |
| **CSRF** | Orígenes de confianza declarados | `CSRF_TRUSTED_ORIGINS` |
| **Content-Security-Policy** | El navegador solo ejecuta código del propio sitio y solo se conecta con la API | Configuración de Nginx de la interfaz |
| **Anti-encuadre** | `X-Frame-Options: DENY`: el sitio no se puede incrustar en otra página | Nginx y `prod.py` |
| **Sin adivinar tipos** | `X-Content-Type-Options: nosniff` | Nginx y `prod.py` |
| **XSS** | React escapa todo lo que muestra; prohibido `dangerouslySetInnerHTML` | Regla del proyecto |

Dos hallazgos de configuración, detectados **leyendo** la configuración y no con pruebas:

1. La CSP inicial solo permitía conectarse con el propio dominio, y la API vive en otro: el inicio
   de sesión habría fallado en producción.
2. En Nginx, un `add_header` dentro de un `location` **anula** todos los del bloque superior. La
   página `index.html` quedaba sin cabeceras de seguridad. Ahora se repiten en ese bloque.

---

## 10. Servidor y despliegue: mínimo privilegio

| Pieza | Qué puede hacer | Qué **no** puede hacer |
|-------|-----------------|------------------------|
| Cuenta de despliegue del servidor | Actualizar el código y compilar | Usar `sudo` sin contraseña, salvo reiniciar **este** servicio |
| Clave de GitHub Actions | Ejecutar el script de despliegue | Abrir una terminal, redirigir puertos ni ejecutar otro comando: el servidor le impone un **comando forzado** |
| Clave de lectura del repositorio | Clonar | Escribir en el repositorio |
| Usuario de la base | Operar sobre **su** base | Acceder a las bases de otros proyectos del servidor |
| Proceso gunicorn | Atender por un socket local | Escuchar en internet: solo Nginx le habla |

El despliegue **respalda la base antes de cada migración** y verifica la configuración con
`check --deploy` antes de reiniciar. Solo se despliega lo que pasó la CI.

---

## 11. Las cuentas de demostración: una excepción declarada

La pantalla de ingreso publica tres cuentas —`admin`, `gerente` y `empleado`, con la clave igual al
usuario— porque el propósito del proyecto es que cualquiera recorra los tres roles. **Publicar una
credencial a propósito exige decir por qué y con qué resguardos:**

- No entran al panel de Django: tienen rol en la aplicación, no privilegios de sistema.
- Cada noche se restablecen los datos y las claves.
- Solo existen donde se activan (`DEMO_CUENTAS=true`): quien clona el repositorio no las tiene.

**En un sistema real no se hace nada de esto.** El detalle está en
[`variables_entorno.md`](variables_entorno.md).

---

## 12. Riesgos aceptados y pendientes

| Tema | Estado | Nota |
|------|--------|------|
| HSTS en el sitio de la interfaz | ⏳ Pendiente | La API ya lo envía; falta en Nginx de la interfaz |
| Auditoría automática de dependencias | ⏳ Pendiente | `pip-audit` y `npm audit` todavía no corren en la CI |
| Límite de intentos por proceso | Aceptado | Hasta 30 por minuto con tres procesos (§4) |
| Cuentas públicas de demostración | Aceptado | Con los tres resguardos de §11 |

---

## 13. Correspondencia con OWASP Top 10 (2021)

| Riesgo | Control en este proyecto | Sección |
|--------|--------------------------|---------|
| A01 · Control de acceso roto | Permiso y alcance por rol en la API; 404 para lo ajeno | 5 |
| A02 · Fallas criptográficas | HTTPS, contraseñas con resumen y sal, datos personales cifrados | 4, 6, 9 |
| A03 · Inyección | Consultas parametrizadas por el ORM; React escapa la salida | 3, 9 |
| A04 · Diseño inseguro | Reglas de negocio en el modelo; pruebas contra la especificación | 5, 7 |
| A05 · Configuración insegura | Configuración por ambiente, `DEBUG=False`, cabeceras de seguridad | 2, 8, 9 |
| A06 · Componentes vulnerables | Versiones fijadas; la auditoría automática está pendiente | 12 |
| A07 · Fallas de identificación y autenticación | JWT breve, renovación rotativa, límite de intentos | 4 |
| A08 · Fallas de integridad | Solo se despliega lo que pasó la CI; clave con comando forzado | 10 |
| A09 · Fallas de registro y monitoreo | Registro de gunicorn y Nginx en el servidor | 10 |
| A10 · Falsificación de solicitudes del servidor | La API solo consulta servicios externos fijos (hito 7) | — |

---

*Última actualización: 2026-09-30*
