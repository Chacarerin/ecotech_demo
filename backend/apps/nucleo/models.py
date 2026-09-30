"""Modelos base abstractos · docs/architecture.md §3.1.

Herencia de la asignatura aplicada donde resuelve un problema real: los campos que
comparten varias entidades se escriben una sola vez. Con `abstract = True`, Django no
crea tabla para estas clases; copia sus campos en cada subclase. Es herencia de
estructura sin costo en las consultas.
"""
from django.db import models


class ModeloAuditable(models.Model):
    """Toda entidad del negocio sabe cuándo se creó y cuándo se modificó por última vez.

    Además valida antes de guardar. Django solo aplica las reglas del modelo si alguien
    llama a full_clean(), y la API REST no lo hace por su cuenta: sin esto, una regla del
    caso se podría saltar con una petición armada a mano.
    """

    creado_en = models.DateTimeField(auto_now_add=True)
    modificado_en = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)


class Persona(ModeloAuditable):
    """Lo que un empleado tiene en común con cualquier persona: nombre y correo.

    El correo no se cifra, a diferencia de la dirección o el teléfono: se usa para
    buscar y debe ser único, y un campo cifrado no se puede buscar ni comparar en
    la base (docs/architecture.md §3.2).
    """

    nombre = models.CharField(max_length=120)
    correo = models.EmailField(unique=True)

    class Meta:
        abstract = True

    def __str__(self) -> str:
        return self.nombre
