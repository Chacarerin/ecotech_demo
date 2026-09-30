from datetime import date
from decimal import Decimal

import pytest
from django.core.exceptions import ValidationError

from .models import Proyecto


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
