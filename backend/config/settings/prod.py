"""Producción: sin depuración y con las protecciones de HTTPS activas."""
from .base import *  # noqa: F401,F403

DEBUG = False

# Nginx termina el TLS y reenvía por el socket: Django confía en su cabecera
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_HSTS_SECONDS = 60 * 60 * 24 * 30
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = "DENY"

# Deliberadamente NO se activan SECURE_HSTS_INCLUDE_SUBDOMAINS ni SECURE_HSTS_PRELOAD,
# aunque `check --deploy` los sugiere: el dominio padre aloja otros sitios en otros
# subdominios, y la política se extendería a sitios que no son de este proyecto.
