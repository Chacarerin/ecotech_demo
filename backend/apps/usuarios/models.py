"""Usuario propio del sistema.

Se declara antes de la primera migración, como exige Django: cambiar el modelo
de usuario con la base ya creada obliga a rehacerla. El rol se agrega en el
hito 2, junto con la autenticación.
"""
from django.contrib.auth.models import AbstractUser


class Usuario(AbstractUser):
    """Cuenta de acceso. Hereda de AbstractUser: usuario, clave cifrada y permisos."""

    class Meta:
        verbose_name = "usuario"
        verbose_name_plural = "usuarios"
