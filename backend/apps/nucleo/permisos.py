"""Permisos por rol, reutilizables en cualquier vista · docs/project_spec.md §4.2.

Cada viewset declara el suyo. La interfaz puede ocultar un botón, pero es aquí donde
se decide: una petición armada a mano pasa por el mismo control.
"""
from rest_framework.permissions import BasePermission


class _PorRol(BasePermission):
    """Base: exige sesión y que el rol del usuario esté entre los admitidos."""

    roles: tuple[str, ...] = ()

    def has_permission(self, request, view) -> bool:
        usuario = request.user
        return bool(usuario and usuario.is_authenticated and usuario.rol in self.roles)


class EsAdministrador(_PorRol):
    """Solo recursos humanos."""

    roles = ("administrador",)


class EsGerenteOAdministrador(_PorRol):
    """Gerentes de departamento y recursos humanos."""

    roles = ("gerente", "administrador")


class EsEmpleado(_PorRol):
    """Quien trabaja en los proyectos: registra sus propias horas."""

    roles = ("empleado",)
