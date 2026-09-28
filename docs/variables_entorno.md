# EcoTech Solutions — Variables de entorno

> **Documento público.** Lista qué variables existen, para qué sirven y dónde vive cada una.
> **No contiene ningún valor real.** Los valores están en los `.env` de cada entorno, que no se
> versionan.
>
> Este documento reemplaza al `credentials.md` del kit, que en los proyectos privados guarda los
> valores. Aquí se separa en dos: la **lista** es pública, los **valores** son privados.

---

## 1. Backend · `backend/.env`

| Variable | Propósito | Desarrollo | Producción | Secreta |
|----------|-----------|------------|------------|---------|
| `DJANGO_SETTINGS_MODULE` | Qué settings cargar | `config.settings.dev` | `config.settings.prod` | No |
| `SECRET_KEY` | Firma de sesiones y tokens | cualquiera, larga | generada, única | **Sí** |
| `DEBUG` | Modo de depuración | `true` | `false` | No |
| `ALLOWED_HOSTS` | Dominios que atiende la API | `localhost,127.0.0.1` | subdominio de la API | No |
| `CORS_ALLOWED_ORIGINS` | Orígenes que pueden llamar a la API | `http://localhost:5173` | dominio de la interfaz, con `https://` | No |
| `CSRF_TRUSTED_ORIGINS` | Orígenes confiables para POST | `http://localhost:5173` | ambos dominios, con `https://` | No |
| `DB_NAME` | Base de datos | `ecotech_demo_db` | `ecotech_demo_db` | No |
| `DB_USER` | Usuario de la base | `ecotech_demo_user` | `ecotech_demo_user` | No |
| `DB_PASSWORD` | Contraseña de la base | local | generada, única | **Sí** |
| `DB_HOST` · `DB_PORT` | Conexión | `localhost` · `5432` | `localhost` · `5432` | No |
| `FIELD_ENCRYPTION_KEY` | Clave Fernet de los datos personales | generada | generada, **respaldada** | **Sí** |
| `JWT_ACCESO_MINUTOS` | Vigencia del token de acceso | `15` | `15` | No |
| `JWT_RENOVACION_HORAS` | Vigencia de la renovación | `8` | `8` | No |

> [!CAUTION]
> **`FIELD_ENCRYPTION_KEY` no se puede perder ni cambiar a la ligera.** Con otra clave, los
> datos ya cifrados quedan ilegibles para siempre. Cambiarla exige descifrar con la antigua y
> volver a cifrar con la nueva, en una migración de datos.

### Cómo generar los valores secretos

```bash
# SECRET_KEY y DB_PASSWORD
python -c "import secrets; print(secrets.token_urlsafe(50))"

# FIELD_ENCRYPTION_KEY
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

---

## 2. Interfaz · `frontend/.env` y `frontend/.env.production`

| Variable | Propósito | Desarrollo | Producción | Secreta |
|----------|-----------|------------|------------|---------|
| `VITE_API_URL` | Dirección de la API | `http://localhost:8000` | subdominio de la API, con `https://` | No |
| `VITE_SITE_URL` | Dirección de la interfaz | `http://localhost:5173` | dominio de la interfaz | No |

> [!WARNING]
> **Toda variable `VITE_*` es pública.** Se compila dentro del JavaScript que descarga cualquier
> visitante. Nunca se pone una credencial en una variable `VITE_*`, aunque el archivo `.env` no
> se versione.

---

## 3. CI · secretos de GitHub

| Secreto | Propósito |
|---------|-----------|
| `VPS_SSH_KEY` | Clave privada de la CI, restringida en el servidor a ejecutar solo el deploy |
| `VPS_HOST` | Dirección del servidor |
| `VPS_USER` | Usuario de despliegue |

Los carga el docente con `gh secret set`. No se escriben en ningún archivo.

---

## 4. Dónde vive cada cosa

| Qué | Dónde | ¿Git? |
|-----|-------|-------|
| La lista de variables | este documento y `.env.example` | Sí |
| Valores de desarrollo | `backend/.env` y `frontend/.env` en el computador | No |
| Valores de producción | los `.env` del proyecto en el servidor, con permisos `600` | No |
| Respaldo de los valores y de la clave de cifrado | carpeta privada del proyecto, fuera del repositorio | No |
| Acceso de la CI al servidor | secretos de GitHub | No |

---

*Última actualización: 2026-09-28*
