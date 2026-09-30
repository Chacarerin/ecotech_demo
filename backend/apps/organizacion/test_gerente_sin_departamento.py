"""Un gerente sin departamento no tiene alcance: no ve nada.

Regresión: con departamento None, el filtro departamento_id=None se convertía en IS NULL
y, al cruzar tablas, dejaba ver los proyectos sin asignaciones y los empleados sin
departamento. Encontrado en una prueba de punta a punta del hito 4.
"""
from datetime import date

import pytest

from apps.proyectos.models import Asignacion, Proyecto
from apps.usuarios.models import Usuario

from .models import Empleado
from .test_api_departamentos import como


@pytest.fixture
def gerente_sin_depto(db):
    Proyecto.objects.create(nombre="Sin asignaciones", fecha_inicio=date(2026, 4, 1))
    suelto = Empleado.objects.create(nombre="Sin departamento", correo="suelto@ecotech.cl",
                                     fecha_inicio=date(2026, 1, 5), salario=800_000)
    con_gente = Proyecto.objects.create(nombre="Con gente", fecha_inicio=date(2026, 4, 1))
    Asignacion.objects.create(empleado=suelto, proyecto=con_gente)
    return Usuario.objects.create_user("g_sin", password="x", rol="gerente")


@pytest.mark.parametrize("url", ["/api/proyectos/", "/api/empleados/", "/api/asignaciones/", "/api/departamentos/"])
def test_no_ve_nada(gerente_sin_depto, url):
    r = como(gerente_sin_depto).get(url)
    assert r.status_code == 200 and r.json() == []
