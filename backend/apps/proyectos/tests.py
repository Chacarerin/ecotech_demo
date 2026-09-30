from datetime import date
from decimal import Decimal

import pytest
from django.core.exceptions import ValidationError

from apps.organizacion.models import Empleado

from .models import Asignacion, Proyecto


def proyecto(**kw):
    datos = {"nombre": "Parque Solar Llay-Llay", "fecha_inicio": date(2026, 4, 1), "ciudad": "Llay-Llay",
             "pais": "Chile", "latitud": Decimal("-32.84"), "longitud": Decimal("-70.95")}
    datos.update(kw)
    return Proyecto.objects.create(**datos)


@pytest.mark.django_db
class TestProyecto:
    def test_nace_activo_y_en_pesos(self):
        p = proyecto()
        assert p.activo and p.moneda == Proyecto.Moneda.CLP

    def test_nombre_unico(self):
        proyecto()
        with pytest.raises(ValidationError, match="Ya existe un proyecto con ese nombre."):
            proyecto()

    def test_coordenadas_fuera_de_rango(self):
        with pytest.raises(ValidationError):
            proyecto(latitud=Decimal("-91"))


@pytest.fixture
def marta(db):
    return Empleado.objects.create(nombre="Marta Rojas", correo="m.rojas@ecotech.cl",
                                   fecha_inicio=date(2026, 1, 5), salario=1_250_000)


@pytest.mark.django_db
class TestAsignacion:
    def test_un_empleado_en_varios_proyectos_y_un_proyecto_con_varios_empleados(self, marta):
        solar, eolico = proyecto(), proyecto(nombre="Parque Eólico Canela")
        diego = Empleado.objects.create(nombre="Diego Pérez", correo="d.perez@ecotech.cl",
                                        fecha_inicio=date(2026, 2, 1), salario=1_000_000)
        for e, p in [(marta, solar), (marta, eolico), (diego, solar)]:
            Asignacion.objects.create(empleado=e, proyecto=p)
        assert set(marta.proyectos.all()) == {solar, eolico}
        assert set(solar.empleados.all()) == {marta, diego}

    def test_vigencia(self, marta):
        a = Asignacion.objects.create(empleado=marta, proyecto=proyecto(), desde=date(2026, 3, 1))
        assert a.vigente
        a.hasta = date(2026, 3, 31)
        a.save()
        assert not a.vigente

    def test_termino_anterior_al_inicio(self, marta):
        with pytest.raises(ValidationError, match="no puede ser anterior"):
            Asignacion.objects.create(empleado=marta, proyecto=proyecto(),
                                      desde=date(2026, 3, 10), hasta=date(2026, 3, 1))


@pytest.mark.django_db
class TestReglasDeAsignacion:
    def test_no_dos_vigentes_al_mismo_proyecto(self, marta):
        solar = proyecto()
        Asignacion.objects.create(empleado=marta, proyecto=solar)
        with pytest.raises(ValidationError, match="ya está asignado a este proyecto"):
            Asignacion.objects.create(empleado=marta, proyecto=solar)

    def test_cerrada_la_anterior_se_puede_volver_a_asignar(self, marta):
        solar = proyecto()
        Asignacion.objects.create(empleado=marta, proyecto=solar, desde=date(2026, 1, 5), hasta=date(2026, 2, 28))
        Asignacion.objects.create(empleado=marta, proyecto=solar)      # la historia queda
        assert marta.asignaciones.count() == 2

    def test_proyecto_desactivado_no_admite_asignaciones_nuevas(self, marta):
        solar = proyecto(activo=False)
        with pytest.raises(ValidationError, match="desactivado"):
            Asignacion.objects.create(empleado=marta, proyecto=solar)

    def test_una_asignacion_existente_se_puede_cerrar_aunque_el_proyecto_se_desactive(self, marta):
        solar = proyecto()
        a = Asignacion.objects.create(empleado=marta, proyecto=solar)
        solar.activo = False
        solar.save()
        a.hasta = date(2026, 9, 29)
        a.save()                                                         # cerrar sí se permite
