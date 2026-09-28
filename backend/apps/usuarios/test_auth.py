import pytest
from rest_framework.test import APIClient

from .models import Usuario

CLAVE = "una-clave-larga-1"


@pytest.fixture
def usuario(db):
    return Usuario.objects.create_user("mrojas", password=CLAVE)


def test_inicio_de_sesion_entrega_acceso_en_el_cuerpo_y_renovacion_en_cookie(usuario):
    r = APIClient().post("/api/auth/token/", {"username": "mrojas", "password": CLAVE}, format="json")
    assert r.status_code == 200
    assert set(r.json()) == {"acceso"}                     # la renovación no viaja en el cuerpo
    cookie = r.cookies["ecotech_renovacion"]
    assert cookie["httponly"] and cookie["samesite"] == "Lax" and cookie["path"] == "/api/auth/"


def test_clave_incorrecta_responde_401_sin_revelar_si_el_usuario_existe(usuario):
    cliente = APIClient()
    mala = cliente.post("/api/auth/token/", {"username": "mrojas", "password": "otra"}, format="json")
    inexistente = cliente.post("/api/auth/token/", {"username": "nadie", "password": "otra"}, format="json")
    assert mala.status_code == inexistente.status_code == 401
    assert mala.json() == inexistente.json()               # misma respuesta en los dos casos
    assert "ecotech_renovacion" not in mala.cookies


def test_el_token_de_acceso_abre_la_api(usuario):
    cliente = APIClient()
    acceso = cliente.post("/api/auth/token/", {"username": "mrojas", "password": CLAVE}, format="json").json()["acceso"]
    cliente.credentials(HTTP_AUTHORIZATION=f"Bearer {acceso}")
    # /api/health/ es público; basta con que el token sea aceptado por la autenticación
    assert cliente.get("/api/health/").status_code == 200
