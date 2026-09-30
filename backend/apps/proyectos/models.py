"""Proyectos y asignaciones · docs/project_spec.md §2.3 y docs/architecture.md §3.5."""
from decimal import Decimal

from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models

from apps.nucleo.models import ModeloAuditable


class Proyecto(ModeloAuditable):
    """Iniciativa de EcoTech. La ubicación y la moneda sirven al hito 7: clima del lugar
    y pago en la moneda del país donde se ejecuta."""

    class Moneda(models.TextChoices):
        CLP = "CLP", "Peso chileno"
        USD = "USD", "Dólar estadounidense"
        EUR = "EUR", "Euro"

    nombre = models.CharField(max_length=120, unique=True,
                              error_messages={"unique": "Ya existe un proyecto con ese nombre."})
    descripcion = models.TextField(blank=True)
    fecha_inicio = models.DateField()      # a diferencia de un empleado, un proyecto puede empezar más adelante
    ciudad = models.CharField(max_length=80, blank=True)
    pais = models.CharField(max_length=80, blank=True)
    latitud = models.DecimalField(max_digits=8, decimal_places=5, null=True, blank=True, validators=[
        MinValueValidator(Decimal("-90")), MaxValueValidator(Decimal("90"))])
    longitud = models.DecimalField(max_digits=8, decimal_places=5, null=True, blank=True, validators=[
        MinValueValidator(Decimal("-180")), MaxValueValidator(Decimal("180"))])
    moneda = models.CharField(max_length=3, choices=Moneda.choices, default=Moneda.CLP)
    activo = models.BooleanField(default=True)

    class Meta:
        ordering = ["-activo", "nombre"]

    def __str__(self) -> str:
        return self.nombre
