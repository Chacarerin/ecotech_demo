from datetime import date
from decimal import Decimal

import pytest
from django.db.models import ProtectedError

from apps.organizacion.models import Empleado
from apps.proyectos.models import Asignacion, Proyecto

from .models import RegistroTiempo


@pytest.fixture
def base(db):
    """Diego trabaja en el Parque Solar desde el 1 de abril de 2026."""
    diego = Empleado.objects.create(nombre="Diego Fuentes", correo="d.fuentes@ecotech.cl",
                                    fecha_inicio=date(2025, 1, 6), salario=1_450_000)
    solar = Proyecto.objects.create(nombre="Parque Solar", fecha_inicio=date(2026, 4, 1))
    Asignacion.objects.create(empleado=diego, proyecto=solar, desde=date(2026, 4, 1))
    return {"diego": diego, "solar": solar}


def registro(base, **kw):
    datos = {"empleado": base["diego"], "proyecto": base["solar"], "fecha": date(2026, 9, 28),
             "horas": Decimal("7.5"), "descripcion": "Montaje de paneles"}
    datos.update(kw)
    return RegistroTiempo.objects.create(**datos)


class TestComposicion:
    def test_las_horas_se_guardan_exactas(self, base):
        assert registro(base).horas == Decimal("7.5")

    def test_un_empleado_con_horas_no_se_borra(self, base):
        # PROTECT: borrar al empleado dejaría horas sin dueño
        registro(base)
        with pytest.raises(ProtectedError):
            base["diego"].delete()
