"""Proyectos y asignaciones · docs/project_spec.md §2.3 y docs/architecture.md §3.5."""
from decimal import Decimal

from django.core.exceptions import ValidationError
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.utils import timezone

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
    # Muchos a muchos con atributos propios: la asociación pasa por Asignacion
    empleados = models.ManyToManyField("organizacion.Empleado", through="Asignacion", related_name="proyectos")

    class Meta:
        ordering = ["-activo", "nombre"]

    def __str__(self) -> str:
        return self.nombre


class Asignacion(ModeloAuditable):
    """Empleado ↔ Proyecto, con vigencia.

    Es la tabla intermedia de la relación de muchos a muchos, igual que en el diagrama de
    clases del caso: tiene atributos propios, desde y hasta, que una lista simple de
    empleados no podría guardar. Cerrar una asignación conserva la historia; por eso
    no se borra, se le pone fecha de término.
    """

    empleado = models.ForeignKey("organizacion.Empleado", on_delete=models.PROTECT, related_name="asignaciones")
    proyecto = models.ForeignKey(Proyecto, on_delete=models.PROTECT, related_name="asignaciones")
    desde = models.DateField(default=timezone.localdate)
    hasta = models.DateField(null=True, blank=True)      # vacío: sigue vigente

    class Meta:
        ordering = ["-desde"]
        verbose_name = "asignación"
        verbose_name_plural = "asignaciones"

    def __str__(self) -> str:
        return f"{self.empleado} en {self.proyecto}"

    @property
    def vigente(self) -> bool:
        return self.hasta is None or self.hasta >= timezone.localdate()

    def clean(self):
        if self.hasta and self.hasta < self.desde:
            raise ValidationError({"hasta": "La fecha de término no puede ser anterior a la de inicio."})
        # A un proyecto desactivado no se asigna gente nueva
        if self._state.adding and self.proyecto_id and not self.proyecto.activo:
            raise ValidationError({"proyecto": "El proyecto está desactivado: no admite asignaciones nuevas."})
        # Regla del caso: sin dos asignaciones vigentes del mismo empleado al mismo proyecto
        if self.vigente and self.empleado_id and self.proyecto_id:
            hoy = timezone.localdate()
            otra_vigente = (
                Asignacion.objects.filter(empleado_id=self.empleado_id, proyecto_id=self.proyecto_id)
                .exclude(pk=self.pk)
                .filter(models.Q(hasta__isnull=True) | models.Q(hasta__gte=hoy))
            )
            if otra_vigente.exists():
                raise ValidationError({"empleado": "El empleado ya está asignado a este proyecto."})
