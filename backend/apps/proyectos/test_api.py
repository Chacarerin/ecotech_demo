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


def test_el_gerente_ve_los_activos_para_poder_asignar_a_su_gente(escenario, proyectos):
    # Sin esto no podría asignar a la primera persona: el proyecto le sería invisible
    assert nombres(como(escenario["gerente"]).get(URL)) == ["Eólico", "Hídrico", "Solar"]


def test_de_los_desactivados_el_gerente_ve_solo_los_de_su_gente(escenario, proyectos):
    Proyecto.objects.filter(pk__in=[proyectos["solar"].pk, proyectos["eolico"].pk]).update(activo=False)
    cliente = como(escenario["gerente"])
    assert nombres(cliente.get(URL)) == ["Hídrico", "Solar"]
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


ASIG = "/api/asignaciones/"


def test_el_gerente_asigna_a_su_gente_pero_no_a_la_de_otro_departamento(escenario, proyectos):
    gerente = como(escenario["gerente"])
    hidrico = Proyecto.objects.get(nombre="Hídrico")
    propio = {"empleado": escenario["empleado"].empleado.id, "proyecto": hidrico.id}
    ajeno = {"empleado": escenario["administrador"].empleado.id, "proyecto": hidrico.id}
    assert gerente.post(ASIG, propio, format="json").status_code == 201
    r = gerente.post(ASIG, ajeno, format="json")
    assert r.status_code == 403 and "su departamento" in r.json()["mensaje"]


def test_el_empleado_consulta_las_suyas_y_no_asigna(escenario, proyectos):
    cliente = como(escenario["empleado"])
    assert [a["proyecto_nombre"] for a in cliente.get(ASIG).json()] == ["Solar"]
    r = cliente.post(ASIG, {"empleado": escenario["empleado"].empleado.id,
                            "proyecto": proyectos["eolico"].id}, format="json")
    assert r.status_code == 403


def test_asignacion_repetida_responde_400_con_el_mensaje_del_caso(escenario, proyectos):
    r = como(escenario["administrador"]).post(ASIG, {"empleado": escenario["empleado"].empleado.id,
                                                    "proyecto": proyectos["solar"].id}, format="json")
    assert r.status_code == 400
    assert r.json()["campos"]["empleado"] == ["El empleado ya está asignado a este proyecto."]


def test_cerrar_solo_cambia_la_fecha_de_termino(escenario, proyectos):
    a = Asignacion.objects.get(proyecto=proyectos["solar"])
    r = como(escenario["administrador"]).patch(f"{ASIG}{a.id}/", {"hasta": "2026-09-29",
                                                                  "proyecto": proyectos["eolico"].id}, format="json")
    assert r.status_code == 200 and r.json()["hasta"] == "2026-09-29"
    assert r.json()["proyecto"] == proyectos["solar"].id          # el proyecto no se reescribe
