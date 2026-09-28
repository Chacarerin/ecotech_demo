import pytest
from django.urls import path
from rest_framework import serializers
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.test import APIClient


class DatoSerializer(serializers.Serializer):
    horas = serializers.IntegerField(min_value=1, max_value=12)


@api_view(["POST"])
@permission_classes([AllowAny])
def valida(request):
    DatoSerializer(data=request.data).is_valid(raise_exception=True)


@api_view(["GET"])
@permission_classes([AllowAny])
def revienta(request):
    raise ValueError("SELECT * FROM tabla_secreta")


@api_view(["GET"])
def protegida(request):
    pass


urlpatterns = [
    path("valida/", valida),
    path("revienta/", revienta),
    path("protegida/", protegida),
]


@pytest.fixture
def cliente(settings):
    settings.ROOT_URLCONF = __name__
    return APIClient(raise_request_exception=False)


def test_validacion_tiene_la_forma_documentada(cliente):
    r = cliente.post("/valida/", {"horas": 20}, format="json")
    assert r.status_code == 400
    assert r.json()["error"] == "validacion"
    assert "horas" in r.json()["campos"]


def test_sin_sesion_responde_401_con_codigo(cliente):
    r = cliente.get("/protegida/")
    assert r.status_code == 401
    assert r.json() == {"error": "no_autenticado", "mensaje": "Debe iniciar sesión."}


def test_error_no_previsto_no_revela_detalles(cliente):
    r = cliente.get("/revienta/")
    assert r.status_code == 500
    assert r.json() == {"error": "interno", "mensaje": "Ocurrió un error inesperado."}
    assert "SELECT" not in r.content.decode()
