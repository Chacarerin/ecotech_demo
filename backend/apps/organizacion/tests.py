from datetime import date, timedelta

import pytest
from django.core.exceptions import ValidationError
from django.db import connection
from django.utils import timezone

from .models import Departamento, Empleado


def empleado(**kw):
    datos = {"nombre": "Marta Rojas", "correo": "m.rojas@ecotech.cl", "fecha_inicio": date(2026, 1, 5),
             "salario": 1_250_000}
    datos.update(kw)
    return Empleado.objects.create(**datos)


@pytest.mark.django_db
class TestReglasDelCaso:
    def test_el_gerente_debe_pertenecer_al_departamento(self):
        ventas, rrhh = Departamento.objects.create(nombre="Ventas"), Departamento.objects.create(nombre="RR.HH.")
        marta = empleado(departamento=rrhh)
        ventas.gerente = marta
        with pytest.raises(ValidationError, match="integrante del departamento"):
            ventas.save()

    def test_un_gerente_no_se_traslada_sin_dejar_la_gerencia(self):
        ventas, rrhh = Departamento.objects.create(nombre="Ventas"), Departamento.objects.create(nombre="RR.HH.")
        marta = empleado(departamento=ventas)
        ventas.gerente = marta
        ventas.save()
        marta.departamento = rrhh
        with pytest.raises(ValidationError, match="gerente de otro departamento"):
            marta.save()

    def test_nombre_de_departamento_unico(self):
        Departamento.objects.create(nombre="Ventas")
        with pytest.raises(ValidationError, match="Ya existe un departamento con ese nombre."):
            Departamento.objects.create(nombre="Ventas")

    def test_fecha_de_inicio_futura_rechazada(self):
        with pytest.raises(ValidationError, match="no puede ser futura"):
            empleado(fecha_inicio=timezone.localdate() + timedelta(days=1))

    def test_salario_debe_ser_positivo(self):
        with pytest.raises(ValidationError, match="mayor que cero"):
            empleado(salario=0)

    def test_telefono_con_formato_invalido_rechazado_aunque_se_cifre(self):
        with pytest.raises(ValidationError, match="formato"):
            empleado(telefono="12345")


@pytest.mark.django_db
def test_en_la_base_los_datos_personales_no_se_leen():
    e = empleado(direccion="Av. Brasil 1234", telefono="+56 9 8765 4321")
    with connection.cursor() as c:
        c.execute("SELECT direccion, telefono, salario FROM organizacion_empleado WHERE id = %s", [e.id])
        fila = c.fetchone()
    assert all(v.startswith("gAAAAA") for v in fila)
    assert "Brasil" not in fila[0] and "8765" not in fila[1] and "1250000" not in fila[2]
    leido = Empleado.objects.get(id=e.id)
    assert (leido.direccion, leido.telefono, leido.salario) == ("Av. Brasil 1234", "+56 9 8765 4321", 1_250_000)
