from datetime import date, timedelta
from decimal import Decimal

import pytest
from django.core.exceptions import ValidationError
from django.db.models import ProtectedError
from django.utils import timezone

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


class TestHorasYFecha:
    @pytest.mark.parametrize("horas", ["0.5", "7", "7.5", "12"])
    def test_horas_validas(self, base, horas):
        assert registro(base, horas=Decimal(horas)).pk

    @pytest.mark.parametrize("horas,mensaje", [
        ("0", "Las horas van de 0,5 a 12."),
        ("12.5", "Las horas van de 0,5 a 12."),
        ("7.3", "pasos de media hora"),
    ])
    def test_horas_invalidas(self, base, horas, mensaje):
        with pytest.raises(ValidationError, match=mensaje):
            registro(base, horas=Decimal(horas))

    def test_no_se_registran_horas_en_el_futuro(self, base):
        manana = timezone.localdate() + timedelta(days=1)
        with pytest.raises(ValidationError, match="No se pueden registrar horas en fechas futuras."):
            registro(base, fecha=manana)


class TestAsignacionVigente:
    MENSAJE = "No tiene asignación vigente en este proyecto para esa fecha."

    def test_sin_asignacion_en_el_proyecto(self, base):
        eolico = Proyecto.objects.create(nombre="Eólico", fecha_inicio=date(2026, 4, 1))
        with pytest.raises(ValidationError, match=self.MENSAJE):
            registro(base, proyecto=eolico)

    def test_antes_de_que_empiece_la_asignacion(self, base):
        with pytest.raises(ValidationError, match=self.MENSAJE):
            registro(base, fecha=date(2026, 3, 31))

    def test_despues_de_cerrada_no_pero_el_ultimo_dia_si(self, base):
        Asignacion.objects.filter(empleado=base["diego"]).update(hasta=date(2026, 9, 15))
        assert registro(base, fecha=date(2026, 9, 15)).pk           # el día de término todavía cuenta
        with pytest.raises(ValidationError, match=self.MENSAJE):
            registro(base, fecha=date(2026, 9, 16))
