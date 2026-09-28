"""Usuario propio del sistema, con su rol.

El rol es un atributo con dominio acotado —tres valores fijos—, no un grupo de
permisos configurable: así lo modela el diagrama de clases del caso, y así se
lee en el código. Ver docs/authentication.md §2.
"""
from django.contrib.auth.models import AbstractUser
from django.db import models


class Usuario(AbstractUser):
    """Cuenta de acceso. Hereda de AbstractUser: usuario, clave cifrada y permisos."""

    class Rol(models.TextChoices):
        ADMINISTRADOR = "administrador", "Administrador"
        GERENTE = "gerente", "Gerente"
        EMPLEADO = "empleado", "Empleado"

    # Por defecto el rol con menos privilegios: nadie obtiene más acceso por omisión
    rol = models.CharField(max_length=20, choices=Rol.choices, default=Rol.EMPLEADO)

    class Meta:
        verbose_name = "usuario"
        verbose_name_plural = "usuarios"

    @property
    def es_administrador(self) -> bool:
        return self.rol == self.Rol.ADMINISTRADOR

    @property
    def es_gerente(self) -> bool:
        return self.rol == self.Rol.GERENTE
