import pytest
from django.urls import path
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.test import APIClient

from apps.nucleo.permisos import EsAdministrador, EsGerenteOAdministrador
from apps.usuarios.models import Usuario


@api_view(["GET"])
@permission_classes([EsAdministrador])
def solo_admin(request):
    return Response({"ok": True})


@api_view(["GET"])
@permission_classes([EsGerenteOAdministrador])
def gerencia(request):
    return Response({"ok": True})


urlpatterns = [path("solo-admin/", solo_admin), path("gerencia/", gerencia)]


@pytest.fixture
def cliente_como(settings, db):
    settings.ROOT_URLCONF = __name__

    def _como(rol):
        cliente = APIClient()
        if rol:
            cliente.force_authenticate(Usuario.objects.create_user(f"u_{rol}", password="x", rol=rol))
        return cliente
    return _como


# (rol, ruta, código esperado): la matriz completa, permitido y denegado
MATRIZ = [
    ("administrador", "/solo-admin/", 200), ("gerente", "/solo-admin/", 403), ("empleado", "/solo-admin/", 403),
    ("administrador", "/gerencia/", 200), ("gerente", "/gerencia/", 200), ("empleado", "/gerencia/", 403),
    (None, "/solo-admin/", 401), (None, "/gerencia/", 401),
]


@pytest.mark.parametrize("rol,ruta,esperado", MATRIZ)
def test_matriz_de_permisos_por_rol(cliente_como, rol, ruta, esperado):
    assert cliente_como(rol).get(ruta).status_code == esperado
