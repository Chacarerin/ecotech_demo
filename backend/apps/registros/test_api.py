from datetime import date, timedelta
from decimal import Decimal

import pytest
from django.utils import timezone

from apps.organizacion.models import Empleado
from apps.organizacion.test_api_departamentos import como, escenario  # noqa: F401
from apps.proyectos.models import Asignacion, Proyecto
from apps.usuarios.models import Usuario

from .models import RegistroTiempo

URL = "/api/registros/"


@pytest.fixture
def horas(escenario):
    """El empleado de Ventas y el administrador, de Recursos Humanos, trabajan en Solar."""
    hoy = timezone.localdate()
    solar = Proyecto.objects.create(nombre="Solar", fecha_inicio=date(2026, 1, 1))
    for rol in ("empleado", "administrador"):
        Asignacion.objects.create(empleado=escenario[rol].empleado, proyecto=solar, desde=date(2026, 1, 1))
    propio = RegistroTiempo.objects.create(empleado=escenario["empleado"].empleado, proyecto=solar,
                                           fecha=hoy, horas=Decimal("8"))
    ajeno = RegistroTiempo.objects.create(empleado=escenario["administrador"].empleado, proyecto=solar,
                                          fecha=hoy, horas=Decimal("6"))
    return {"solar": solar, "propio": propio, "ajeno": ajeno, "hoy": hoy}


def ids(r):
    return sorted(x["id"] for x in r.json())


def test_cada_rol_ve_su_alcance(escenario, horas):
    assert ids(como(escenario["administrador"]).get(URL)) == sorted([horas["propio"].id, horas["ajeno"].id])
    assert ids(como(escenario["gerente"]).get(URL)) == [horas["propio"].id]        # solo Ventas
    assert ids(como(escenario["empleado"]).get(URL)) == [horas["propio"].id]
    assert como(escenario["empleado"]).get(f"{URL}{horas['ajeno'].id}/").status_code == 404


def test_el_empleado_registra_a_su_nombre_aunque_intente_otro(escenario, horas):
    otro = escenario["administrador"].empleado.id
    r = como(escenario["empleado"]).post(URL, {"proyecto": horas["solar"].id, "fecha": str(horas["hoy"] - timedelta(days=1)),
                                               "horas": "7.5", "empleado": otro}, format="json")
    assert r.status_code == 201
    assert r.json()["empleado"] == escenario["empleado"].empleado.id                # el cuerpo no decide
    assert r.json()["autor"] == escenario["empleado"].id


def test_gerente_y_administracion_no_registran_horas(escenario, horas):
    datos = {"proyecto": horas["solar"].id, "fecha": str(horas["hoy"]), "horas": "1"}
    assert como(escenario["gerente"]).post(URL, datos, format="json").status_code == 403
    assert como(escenario["administrador"]).post(URL, datos, format="json").status_code == 403


def test_las_reglas_del_modelo_responden_400_con_su_mensaje(escenario, horas):
    r = como(escenario["empleado"]).post(URL, {"proyecto": horas["solar"].id, "fecha": str(horas["hoy"]),
                                               "horas": "5"}, format="json")
    assert r.status_code == 400
    assert r.json()["campos"]["horas"] == ["Supera las 12 horas diarias. Ese día le quedan 4 h."]


def test_fuera_de_los_siete_dias_no_se_registra_edita_ni_elimina(escenario, horas):
    cliente = como(escenario["empleado"])
    antiguo = horas["hoy"] - timedelta(days=8)
    r = cliente.post(URL, {"proyecto": horas["solar"].id, "fecha": str(antiguo), "horas": "2"}, format="json")
    assert r.status_code == 400 and "últimos 7 días" in r.json()["campos"]["fecha"][0]
    # Mover un registro reciente a una fecha antigua tampoco
    r = cliente.patch(f"{URL}{horas['propio'].id}/", {"fecha": str(antiguo)}, format="json")
    assert r.status_code == 400
    # Un registro antiguo ya no se toca
    RegistroTiempo.objects.filter(pk=horas["propio"].pk).update(fecha=antiguo)
    assert cliente.patch(f"{URL}{horas['propio'].id}/", {"horas": "1"}, format="json").status_code == 400
    assert cliente.delete(f"{URL}{horas['propio'].id}/").status_code == 400


def test_dentro_del_plazo_edita_y_elimina_lo_suyo(escenario, horas):
    cliente = como(escenario["empleado"])
    r = cliente.patch(f"{URL}{horas['propio'].id}/", {"horas": "7.5", "descripcion": "Inspección"}, format="json")
    assert r.status_code == 200 and r.json()["horas"] == "7.5"
    assert cliente.delete(f"{URL}{horas['propio'].id}/").status_code == 204


def test_filtra_por_rango_de_fechas(escenario, horas):
    ayer = str(horas["hoy"] - timedelta(days=1))
    assert como(escenario["administrador"]).get(URL, {"hasta": ayer}).json() == []


def test_una_cuenta_de_empleado_sin_ficha_no_registra(escenario, horas):
    Empleado.objects.filter(usuario=escenario["empleado"]).update(usuario=None)
    cuenta = Usuario.objects.get(pk=escenario["empleado"].pk)        # sin la ficha en caché, como en una petición real
    r = como(cuenta).post(URL, {"proyecto": horas["solar"].id, "fecha": str(horas["hoy"]),
                                               "horas": "1"}, format="json")
    assert r.status_code == 403
