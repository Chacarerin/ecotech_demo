from datetime import date

import pytest

from apps.organizacion.test_api_departamentos import como, escenario  # noqa: F401

from .models import Asignacion, Proyecto

URL = "/api/proyectos/"


@pytest.fixture
def proyectos(escenario):
    """Solar tiene al empleado de Ventas; Eólico, al de Recursos Humanos; Hídrico, a nadie."""
    solar = Proyecto.objects.create(nombre="Solar", fecha_inicio=date(2026, 4, 1))
    eolico = Proyecto.objects.create(nombre="Eólico", fecha_inicio=date(2026, 4, 1))
    Proyecto.objects.create(nombre="Hídrico", fecha_inicio=date(2026, 4, 1))
    Asignacion.objects.create(empleado=escenario["empleado"].empleado, proyecto=solar)
    Asignacion.objects.create(empleado=escenario["administrador"].empleado, proyecto=eolico)
    return {"solar": solar, "eolico": eolico}


def nombres(r):
    return sorted(p["nombre"] for p in r.json())


def test_administracion_ve_todos_con_su_dotacion(escenario, proyectos):
    r = como(escenario["administrador"]).get(URL)
    assert nombres(r) == ["Eólico", "Hídrico", "Solar"]
    assert {p["nombre"]: p["asignados_vigentes"] for p in r.json()}["Solar"] == 1


def test_el_gerente_ve_los_proyectos_con_gente_de_su_departamento(escenario, proyectos):
    cliente = como(escenario["gerente"])
    assert nombres(cliente.get(URL)) == ["Solar"]
    assert cliente.get(f"{URL}{proyectos['eolico'].id}/").status_code == 404


def test_el_empleado_ve_solo_los_suyos(escenario, proyectos):
    assert nombres(como(escenario["empleado"]).get(URL)) == ["Solar"]


def test_solo_administracion_crea_y_nadie_elimina(escenario, proyectos):
    nuevo = {"nombre": "Biomasa", "fecha_inicio": "2026-05-01"}
    assert como(escenario["gerente"]).post(URL, nuevo, format="json").status_code == 403
    admin = como(escenario["administrador"])
    assert admin.post(URL, nuevo, format="json").status_code == 201
    assert admin.delete(f"{URL}{proyectos['solar'].id}/").status_code == 405


def test_desactivar_y_filtrar_por_estado(escenario, proyectos):
    admin = como(escenario["administrador"])
    assert admin.patch(f"{URL}{proyectos['solar'].id}/", {"activo": False}, format="json").status_code == 200
    assert nombres(admin.get(URL, {"activo": "true"})) == ["Eólico", "Hídrico"]
