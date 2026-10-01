"""Registro de horas trabajadas · docs/project_spec.md §4.1 y docs/uml.md §2.

Es la composición del caso: un registro no existe sin su proyecto. Por eso la clave hacia
el proyecto es PROTECT, y un proyecto con horas registradas no se puede eliminar.
"""
from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import Q

from apps.nucleo.models import ModeloAuditable
from apps.nucleo.validadores import NoFutura, media_hora


class RegistroTiempo(ModeloAuditable):
    """Horas que un empleado trabajó en un proyecto, un día determinado."""

    empleado = models.ForeignKey("organizacion.Empleado", on_delete=models.PROTECT, related_name="registros")
    proyecto = models.ForeignKey("proyectos.Proyecto", on_delete=models.PROTECT, related_name="registros")
    fecha = models.DateField(validators=[NoFutura("No se pueden registrar horas en fechas futuras.")])
    # Decimal y no float: 7,5 horas se guardan exactas, y sumarlas no acumula error
    horas = models.DecimalField(max_digits=4, decimal_places=1, validators=[media_hora])
    descripcion = models.TextField(blank=True)
    # Quién lo registró. Normalmente el propio empleado; queda constancia aunque no lo sea
    autor = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL,
                              related_name="registros_creados")

    class Meta:
        ordering = ["-fecha", "-creado_en"]
        verbose_name = "registro de tiempo"
        verbose_name_plural = "registros de tiempo"

    def __str__(self) -> str:
        return f"{self.empleado} · {self.proyecto} · {self.fecha} · {self.horas} h"

    def clean(self):
        if not (self.empleado_id and self.proyecto_id and self.fecha):
            return              # los campos faltantes ya los informa la validación de cada campo
        # Regla del caso: solo se registran horas dentro de una asignación vigente en esa fecha
        asignado = self.proyecto.asignaciones.filter(
            Q(hasta__isnull=True) | Q(hasta__gte=self.fecha),
            empleado_id=self.empleado_id, desde__lte=self.fecha,
        ).exists()
        if not asignado:
            raise ValidationError({"proyecto": "No tiene asignación vigente en este proyecto para esa fecha."})
