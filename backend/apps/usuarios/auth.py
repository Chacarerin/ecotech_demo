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
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer


def _con_renovacion(respuesta: Response, renovacion: str) -> Response:
    """Adjunta el token de renovación como cookie, con la duración del propio token."""
    vida = settings.SIMPLE_JWT["REFRESH_TOKEN_LIFETIME"]
    respuesta.set_cookie(value=renovacion, max_age=int(vida.total_seconds()), **settings.COOKIE_RENOVACION)
    return respuesta


class IniciarSesion(APIView):
    """POST /api/auth/token/ · usuario y clave → token de acceso + cookie de renovación."""

    permission_classes = [AllowAny]
    authentication_classes = []   # un token vencido en la cabecera no debe impedir volver a entrar

    def get_authenticate_header(self, request):
        # Sin clases de autenticación DRF no tiene cabecera que ofrecer y convierte el
        # 401 en 403. Se declara explícita para que una clave incorrecta siga siendo 401.
        return 'Bearer realm="api"'

    def post(self, request):
        serializer = TokenObtainPairSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        tokens = serializer.validated_data
        return _con_renovacion(Response({"acceso": tokens["access"]}, status=status.HTTP_200_OK),
                               tokens["refresh"])
