import pytest

from .test_api_departamentos import como, escenario  # noqa: F401 · reutiliza el mismo escenario

URL = "/api/empleados/"
PERSONALES = {"direccion", "telefono", "salario"}


def test_administracion_ve_a_todos_con_datos_personales(escenario):
    r = como(escenario["administrador"]).get(URL)
    assert r.status_code == 200 and len(r.json()) == 3
    assert PERSONALES <= set(r.json()[0])


def test_el_gerente_ve_su_departamento_sin_datos_personales(escenario):
    r = como(escenario["gerente"]).get(URL)
    assert sorted(e["nombre"] for e in r.json()) == ["Empleado", "Gerente"]
    assert all(not (PERSONALES & set(e)) for e in r.json())


def test_el_empleado_ve_solo_su_ficha_con_sus_datos(escenario):
    r = como(escenario["empleado"]).get(URL)
    assert [e["nombre"] for e in r.json()] == ["Empleado"]
    assert r.json()[0]["salario"] == 900_000


def test_el_empleado_no_ve_la_ficha_de_otro_ni_puede_editar_la_suya(escenario):
    cliente = como(escenario["empleado"])
    otro = escenario["gerente"].empleado
    assert cliente.get(f"{URL}{otro.id}/").status_code == 404
    propio = escenario["empleado"].empleado
    assert cliente.patch(f"{URL}{propio.id}/", {"salario": 9_999_999}, format="json").status_code == 403


def test_busqueda_por_nombre_o_correo(escenario):
    cliente = como(escenario["administrador"])
    assert [e["nombre"] for e in cliente.get(URL, {"q": "geren"}).json()] == ["Gerente"]
    assert [e["nombre"] for e in cliente.get(URL, {"q": "empleado@"}).json()] == ["Empleado"]


def test_alta_con_id_automatico_y_correo_repetido_rechazado(escenario):
    cliente = como(escenario["administrador"])
    nuevo = {"nombre": "Diego Pérez", "correo": "d.perez@ecotech.cl", "fecha_inicio": "2026-03-01",
             "salario": 1_100_000, "telefono": "+56 9 1234 5678", "departamento": escenario["ventas"].id}
    r = cliente.post(URL, nuevo, format="json")
    assert r.status_code == 201 and isinstance(r.json()["id"], int)
    r = cliente.post(URL, {**nuevo, "nombre": "Otro"}, format="json")
    assert r.status_code == 400
    assert r.json()["campos"]["correo"] == ["Ya existe un empleado con ese correo."]


def test_telefono_invalido_llega_como_400_con_el_campo(escenario):
    r = como(escenario["administrador"]).post(URL, {
        "nombre": "Ana", "correo": "ana@ecotech.cl", "fecha_inicio": "2026-03-01", "salario": 800_000,
        "telefono": "12345"}, format="json")
    assert r.status_code == 400 and "telefono" in r.json()["campos"]
