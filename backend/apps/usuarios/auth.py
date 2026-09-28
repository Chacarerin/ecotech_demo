"""Endpoints de sesión · docs/authentication.md §3.

El token de acceso se entrega en el cuerpo de la respuesta y la interfaz lo guarda
en memoria. El de renovación se entrega en una cookie HttpOnly: el JavaScript de la
página nunca lo ve, así que un script inyectado no puede robarlo.
"""
from django.conf import settings
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.exceptions import AuthenticationFailed, NotAuthenticated
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer, TokenRefreshSerializer
from rest_framework_simplejwt.tokens import RefreshToken

from .serializers import UsuarioActualSerializer


def _con_renovacion(respuesta: Response, renovacion: str) -> Response:
    """Adjunta el token de renovación como cookie, con la duración del propio token."""
    vida = settings.SIMPLE_JWT["REFRESH_TOKEN_LIFETIME"]
    respuesta.set_cookie(value=renovacion, max_age=int(vida.total_seconds()), **settings.COOKIE_RENOVACION)
    return respuesta


class _SinAutenticacion(APIView):
    """Base de los endpoints de sesión: no exigen un token de acceso.

    Un token vencido en la cabecera no debe impedir volver a entrar ni renovar.
    """

    permission_classes = [AllowAny]
    authentication_classes = []

    def get_authenticate_header(self, request):
        # Sin clases de autenticación DRF no tiene cabecera que ofrecer y convierte el
        # 401 en 403. Se declara explícita para que una sesión inválida siga siendo 401.
        return 'Bearer realm="api"'


class IniciarSesion(_SinAutenticacion):
    """POST /api/auth/token/ · usuario y clave → token de acceso + cookie de renovación."""

    def post(self, request):
        serializer = TokenObtainPairSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        tokens = serializer.validated_data
        return _con_renovacion(Response({"acceso": tokens["access"]}, status=status.HTTP_200_OK),
                               tokens["refresh"])


class RenovarSesion(_SinAutenticacion):
    """POST /api/auth/token/refresh/ · cookie de renovación → acceso nuevo + renovación rotada."""

    def post(self, request):
        renovacion = request.COOKIES.get(settings.COOKIE_RENOVACION["key"])
        if not renovacion:
            raise NotAuthenticated()
        serializer = TokenRefreshSerializer(data={"refresh": renovacion})
        try:
            serializer.is_valid(raise_exception=True)
        except TokenError as exc:
            raise AuthenticationFailed() from exc
        datos = serializer.validated_data
        return _con_renovacion(Response({"acceso": datos["access"]}), datos["refresh"])


class CerrarSesion(_SinAutenticacion):
    """POST /api/auth/logout/ · invalida la renovación en el servidor y borra la cookie.

    Borrar solo la cookie no basta: quien la hubiera copiado podría seguir renovando.
    """

    def post(self, request):
        renovacion = request.COOKIES.get(settings.COOKIE_RENOVACION["key"])
        if renovacion:
            try:
                RefreshToken(renovacion).blacklist()
            except TokenError:
                pass    # ya vencida o ya invalidada: el resultado buscado es el mismo
        respuesta = Response(status=status.HTTP_204_NO_CONTENT)
        respuesta.delete_cookie(settings.COOKIE_RENOVACION["key"], path=settings.COOKIE_RENOVACION["path"],
                                samesite=settings.COOKIE_RENOVACION["samesite"])
        return respuesta


class UsuarioActual(APIView):
    """GET /api/auth/yo/ · quién tiene la sesión y con qué rol.

    La interfaz lo usa para decidir qué mostrar. Los permisos no dependen de esto:
    cada endpoint los verifica por su cuenta.
    """

    def get(self, request):
        return Response(UsuarioActualSerializer(request.user).data)
