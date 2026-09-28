import pytest
from django.db import DatabaseError
from rest_framework.test import APIClient

URL = "/api/health/"


@pytest.mark.django_db
def test_health_responde_ok_sin_sesion():
    respuesta = APIClient().get(URL)
    assert respuesta.status_code == 200
    assert respuesta.json() == {"estado": "ok", "base": "ok"}


@pytest.mark.django_db
def test_health_responde_503_si_la_base_falla_sin_revelar_el_error(monkeypatch):
    def cursor_roto(*args, **kwargs):
        raise DatabaseError("detalle interno que no debe salir")

    monkeypatch.setattr("apps.nucleo.views.connection.cursor", cursor_roto)
    respuesta = APIClient().get(URL)
    assert respuesta.status_code == 503
    assert respuesta.json() == {"estado": "degradado", "base": "error"}
    assert "detalle interno" not in respuesta.content.decode()
