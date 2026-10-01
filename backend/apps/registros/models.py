"""Registro de horas trabajadas · docs/project_spec.md §4.1 y docs/uml.md §2.

Es la composición del caso: un registro no existe sin su proyecto. Por eso la clave hacia
el proyecto es PROTECT, y un proyecto con horas registradas no se puede eliminar.
"""
from django.conf import settings
from django.db import models

from apps.nucleo.models import ModeloAuditable


class RegistroTiempo(ModeloAuditable):
    """Horas que un empleado trabajó en un proyecto, un día determinado."""

    empleado = models.ForeignKey("organizacion.Empleado", on_delete=models.PROTECT, related_name="registros")
    proyecto = models.ForeignKey("proyectos.Proyecto", on_delete=models.PROTECT, related_name="registros")
    fecha = models.DateField()
    # Decimal y no float: 7,5 horas se guardan exactas, y sumarlas no acumula error
    horas = models.DecimalField(max_digits=4, decimal_places=1)
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
