"""Manejador de errores de la API.

Toda respuesta de error tiene la misma forma, documentada en docs/architecture.md §4:

    {"error": "<código>", "mensaje": "<texto para el usuario>", "campos": {...}}

Ninguna incluye trazas, consultas SQL ni rutas internas. Un error no previsto se
registra completo en el log del servidor y al cliente solo le llega un mensaje genérico.
"""
import logging

from django.db.models import ProtectedError
from django.http import Http404
from rest_framework import exceptions, status
from rest_framework.response import Response
from rest_framework.views import exception_handler

log = logging.getLogger(__name__)

CODIGOS = {
    exceptions.ValidationError: ("validacion", "Los datos enviados no son válidos."),
    exceptions.NotAuthenticated: ("no_autenticado", "Debe iniciar sesión."),
    exceptions.AuthenticationFailed: ("no_autenticado", "La sesión no es válida o expiró."),
    exceptions.PermissionDenied: ("sin_permiso", "No tiene permiso para esta acción."),
    exceptions.NotFound: ("no_encontrado", "El recurso no existe."),
    exceptions.MethodNotAllowed: ("metodo_no_permitido", "Método no permitido."),
    exceptions.Throttled: ("demasiados_intentos", "Demasiados intentos. Espere un momento."),
}


def manejar_excepcion(exc, context):
    if isinstance(exc, Http404):
        exc = exceptions.NotFound()
    if isinstance(exc, ProtectedError):
        return Response(
            {"error": "conflicto", "mensaje": "No se puede eliminar: hay registros que dependen de este."},
            status=status.HTTP_409_CONFLICT,
        )

    respuesta = exception_handler(exc, context)

    if respuesta is None:
        # Error no previsto: detalle completo al log, mensaje genérico al cliente
        log.exception("Error no controlado en %s", context.get("view"))
        return Response(
            {"error": "interno", "mensaje": "Ocurrió un error inesperado."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    codigo, mensaje = next(
        (valor for tipo, valor in CODIGOS.items() if isinstance(exc, tipo)),
        ("error", "No se pudo completar la solicitud."),
    )
    cuerpo = {"error": codigo, "mensaje": mensaje}
    if isinstance(exc, exceptions.ValidationError):
        cuerpo["campos"] = exc.detail if isinstance(exc.detail, dict) else {"general": exc.detail}
    respuesta.data = cuerpo
    return respuesta
