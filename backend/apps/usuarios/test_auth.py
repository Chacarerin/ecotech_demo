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


def _entrar(cliente):
    return cliente.post("/api/auth/token/", {"username": "mrojas", "password": CLAVE}, format="json")


def test_renovar_entrega_acceso_nuevo_y_rota_la_cookie(usuario):
    cliente = APIClient()
    primera = _entrar(cliente).cookies["ecotech_renovacion"].value
    r = cliente.post("/api/auth/token/refresh/")
    assert r.status_code == 200 and "acceso" in r.json()
    assert r.cookies["ecotech_renovacion"].value != primera


def test_una_renovacion_ya_usada_no_sirve_otra_vez(usuario):
    cliente = APIClient()
    robada = _entrar(cliente).cookies["ecotech_renovacion"].value
    cliente.post("/api/auth/token/refresh/")                 # el usuario legítimo renueva
    atacante = APIClient()
    atacante.cookies["ecotech_renovacion"] = robada
    assert atacante.post("/api/auth/token/refresh/").status_code == 401


def test_renovar_sin_cookie_responde_401(db):
    assert APIClient().post("/api/auth/token/refresh/").status_code == 401


def test_cerrar_sesion_invalida_la_renovacion_en_el_servidor(usuario):
    cliente = APIClient()
    copia = _entrar(cliente).cookies["ecotech_renovacion"].value
    assert cliente.post("/api/auth/logout/").status_code == 204
    otro = APIClient()
    otro.cookies["ecotech_renovacion"] = copia               # alguien que había copiado la cookie
    assert otro.post("/api/auth/token/refresh/").status_code == 401


def test_yo_exige_sesion(db):
    assert APIClient().get("/api/auth/yo/").status_code == 401


def test_yo_devuelve_el_usuario_y_su_rol_sin_datos_de_mas(usuario):
    usuario.first_name, usuario.last_name, usuario.rol = "María", "Rojas", Usuario.Rol.GERENTE
    usuario.save()
    cliente = APIClient()
    cliente.credentials(HTTP_AUTHORIZATION=f"Bearer {_entrar(cliente).json()['acceso']}")
    r = cliente.get("/api/auth/yo/")
    assert r.status_code == 200
    assert r.json() == {"id": usuario.id, "username": "mrojas", "nombre": "María Rojas", "rol": "gerente"}


def test_el_sexto_intento_en_un_minuto_se_rechaza(usuario):
    cliente = APIClient()
    for _ in range(5):
        cliente.post("/api/auth/token/", {"username": "mrojas", "password": "equivocada"}, format="json")
    r = cliente.post("/api/auth/token/", {"username": "mrojas", "password": CLAVE}, format="json")
    assert r.status_code == 429                              # ni con la clave correcta
    assert r.json()["error"] == "demasiados_intentos"
