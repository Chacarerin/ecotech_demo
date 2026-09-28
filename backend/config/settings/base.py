"""Configuración común a todos los entornos.

Todo lo que cambia entre entornos, y todo lo secreto, se lee del archivo .env
de backend/. Este archivo no contiene ningún valor sensible.
"""
import os
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent.parent
load_dotenv(BASE_DIR / ".env")


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
ALLOWED_HOSTS = lista("ALLOWED_HOSTS", "localhost,127.0.0.1")

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    # Terceros
    "rest_framework",
    "rest_framework_simplejwt.token_blacklist",
    "corsheaders",
    # Propias
    "apps.nucleo",
    "apps.usuarios",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    # Debe ir antes de CommonMiddleware para responder las consultas previas del navegador
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"
WSGI_APPLICATION = "config.wsgi.application"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

# PostgreSQL en todos los entornos: nunca SQLite, ni siquiera para probar.
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": obligatoria("DB_NAME"),
        "USER": obligatoria("DB_USER"),
        "PASSWORD": obligatoria("DB_PASSWORD"),
        "HOST": os.environ.get("DB_HOST", "localhost"),
        "PORT": os.environ.get("DB_PORT", "5432"),
    }
}

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator", "OPTIONS": {"min_length": 10}},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

LANGUAGE_CODE = "es-cl"
TIME_ZONE = "America/Santiago"
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# Usuario propio desde el primer día: cambiarlo después obliga a rehacer la base
AUTH_USER_MODEL = "usuarios.Usuario"

# CORS y CSRF: la interfaz vive en otro dominio. Lista exacta, nunca «*».
CORS_ALLOWED_ORIGINS = lista("CORS_ALLOWED_ORIGINS")
CSRF_TRUSTED_ORIGINS = lista("CSRF_TRUSTED_ORIGINS")
CORS_ALLOW_CREDENTIALS = True

REST_FRAMEWORK = {
    # JWT desde el inicio: sin sesión, la API responde 401 y no 403. Los endpoints
    # para obtener y renovar el token se agregan con la autenticación, en el hito 2.
    "DEFAULT_AUTHENTICATION_CLASSES": ["rest_framework_simplejwt.authentication.JWTAuthentication"],
    # Todo endpoint exige sesión salvo que declare lo contrario de forma explícita
    "DEFAULT_PERMISSION_CLASSES": ["rest_framework.permissions.IsAuthenticated"],
    # Todas las respuestas de error con la misma forma y sin detalles internos
    "EXCEPTION_HANDLER": "apps.nucleo.excepciones.manejar_excepcion",
}

# ── Sesión con JWT · docs/authentication.md §3 ──────────────────────────────
from datetime import timedelta  # noqa: E402

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=int(os.environ.get("JWT_ACCESO_MINUTOS", "15"))),
    "REFRESH_TOKEN_LIFETIME": timedelta(hours=int(os.environ.get("JWT_RENOVACION_HORAS", "8"))),
    # Cada renovación entrega una renovación nueva e invalida la anterior: una
    # renovación robada deja de servir en cuanto el usuario legítimo la usa.
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "UPDATE_LAST_LOGIN": True,
}

# La renovación viaja en una cookie que JavaScript no puede leer, y solo hacia
# /api/auth/: el resto de la API nunca la recibe.
COOKIE_RENOVACION = {
    "key": "ecotech_renovacion",
    "httponly": True,
    "secure": False,          # prod.py lo activa: en local no hay HTTPS
    "samesite": "Lax",
    "path": "/api/auth/",
}
