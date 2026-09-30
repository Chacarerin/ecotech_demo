"""Departamentos y empleados · docs/project_spec.md §2.3 y docs/architecture.md §3.

Aquí se ven juntos varios conceptos de la asignatura:
- Herencia: Empleado hereda de Persona, que hereda de ModeloAuditable.
- Encapsulamiento: dirección, teléfono y salario se cifran sin que el resto lo note.
- Asociación: Empleado → Departamento (0..1) y Departamento → gerente (0..1).
"""
from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models

from apps.nucleo.campos import CampoCifrado
from apps.nucleo.models import ModeloAuditable, Persona
from apps.nucleo.validadores import NoFutura, telefono_chileno


class Departamento(ModeloAuditable):
    """Unidad de la empresa: Desarrollo Sostenible, Ventas, Recursos Humanos…"""

    nombre = models.CharField(
        max_length=80, unique=True,
        error_messages={"unique": "Ya existe un departamento con ese nombre."},
    )
    # Si el gerente deja la empresa, el departamento queda sin gerente; no se borra
    gerente = models.ForeignKey(
        "Empleado", null=True, blank=True, on_delete=models.SET_NULL, related_name="departamentos_a_cargo",
    )

    class Meta:
        ordering = ["nombre"]

    def __str__(self) -> str:
        return self.nombre


class Empleado(Persona):
    """Persona contratada por EcoTech. El identificador lo asigna la base al crearlo."""

    fecha_inicio = models.DateField(validators=[NoFutura("La fecha de inicio no puede ser futura.")])
    # Un solo departamento a la vez: una clave foránea, no una relación de muchos a muchos
    departamento = models.ForeignKey(
        Departamento, null=True, blank=True, on_delete=models.SET_NULL, related_name="empleados",
    )
    # La cuenta con que el empleado inicia sesión, si la tiene
    usuario = models.OneToOneField(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="empleado",
    )

    # Datos personales cifrados en reposo · docs/architecture.md §3.2
    direccion = CampoCifrado(blank=True)
    telefono = CampoCifrado(blank=True, validators=[telefono_chileno])
    salario = CampoCifrado(tipo=int, validators=[MinValueValidator(1, "El salario debe ser mayor que cero.")])

    class Meta:
        ordering = ["nombre"]
