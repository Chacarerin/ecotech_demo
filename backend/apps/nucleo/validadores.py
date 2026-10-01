"""Validadores reutilizables · docs/project_spec.md §3.3 y §4.1.

Se aplican en el modelo, así que rigen para la API, el admin y cualquier otro camino
de entrada: la interfaz también valida, pero solo para responder más rápido.
"""
import re
from datetime import date
from decimal import Decimal

from django.core.exceptions import ValidationError
from django.utils import timezone
from django.utils.deconstruct import deconstructible

_TELEFONO = re.compile(r"^\+56 ?9 ?\d{4} ?\d{4}$")


def telefono_chileno(valor: str) -> None:
    """Celular chileno: +56 9 XXXX XXXX, con o sin espacios."""
    if not _TELEFONO.match(valor or ""):
        raise ValidationError("Ingrese un teléfono con el formato +56 9 XXXX XXXX.", code="telefono")


@deconstructible
class NoFutura:
    """Una fecha que no puede ser posterior a hoy. El mensaje depende del contexto."""

    def __init__(self, mensaje: str = "La fecha no puede ser futura."):
        self.mensaje = mensaje

    def __call__(self, valor: date) -> None:
        if valor and valor > timezone.localdate():
            raise ValidationError(self.mensaje, code="fecha_futura")

    def __eq__(self, otro) -> bool:
        return isinstance(otro, NoFutura) and self.mensaje == otro.mensaje


def media_hora(valor) -> None:
    """Horas de 0,5 a 12, en pasos de media hora: 7,5 sí; 7,3 no."""
    if valor is None:
        return
    if valor < Decimal("0.5") or valor > Decimal("12"):
        raise ValidationError("Las horas van de 0,5 a 12.", code="horas_fuera_de_rango")
    if (valor * 2) % 1 != 0:
        raise ValidationError("Las horas se registran en pasos de media hora: 7, 7,5 u 8.", code="horas_paso")
