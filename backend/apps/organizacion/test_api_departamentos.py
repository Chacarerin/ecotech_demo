from datetime import date

import pytest
from rest_framework.test import APIClient

from apps.usuarios.models import Usuario

from .models import Departamento, Empleado

URL = "/api/departamentos/"


@pytest.fixture
def escenario(db):
    ventas = Departamento.objects.create(nombre="Ventas")
    rrhh = Departamento.objects.create(nombre="Recursos Humanos")
    cuentas = {}
    for rol, depto in [("administrador", rrhh), ("gerente", ventas), ("empleado", ventas)]:
        u = Usuario.objects.create_user(rol, password="x", rol=rol)
        Empleado.objects.create(nombre=rol.title(), correo=f"{rol}@ecotech.cl", fecha_inicio=date(2026, 1, 5),
                                salario=900_000, departamento=depto, usuario=u)
        cuentas[rol] = u
    return {"ventas": ventas, "rrhh": rrhh, **cuentas}


def como(usuario):
    cliente = APIClient()
    cliente.force_authenticate(usuario)
    return cliente


def test_administracion_ve_todos_con_su_dotacion(escenario):
    r = como(escenario["administrador"]).get(URL)
    assert r.status_code == 200
    assert {d["nombre"]: d["cantidad_empleados"] for d in r.json()} == {"Recursos Humanos": 1, "Ventas": 2}


def test_el_gerente_solo_ve_el_suyo_y_el_ajeno_no_existe_para_el(escenario):
    cliente = como(escenario["gerente"])
    assert [d["nombre"] for d in cliente.get(URL).json()] == ["Ventas"]
    assert cliente.get(f"{URL}{escenario['rrhh'].id}/").status_code == 404


def test_el_gerente_no_puede_crear_ni_el_empleado_ver(escenario):
    assert como(escenario["gerente"]).post(URL, {"nombre": "Nuevo"}, format="json").status_code == 403
    assert como(escenario["empleado"]).get(URL).status_code == 403


def test_administracion_crea_y_el_nombre_repetido_se_rechaza_con_su_mensaje(escenario):
    cliente = como(escenario["administrador"])
    assert cliente.post(URL, {"nombre": "Investigación y Desarrollo"}, format="json").status_code == 201
    r = cliente.post(URL, {"nombre": "Ventas"}, format="json")
    assert r.status_code == 400
    assert r.json()["campos"]["nombre"] == ["Ya existe un departamento con ese nombre."]


def test_asignar_un_gerente_ajeno_al_departamento_responde_400(escenario):
    admin_empleado = escenario["administrador"].empleado           # pertenece a Recursos Humanos
    r = como(escenario["administrador"]).patch(f"{URL}{escenario['ventas'].id}/",
                                              {"gerente": admin_empleado.id}, format="json")
    assert r.status_code == 400
    assert r.json()["campos"]["gerente"] == ["El gerente debe ser integrante del departamento."]
