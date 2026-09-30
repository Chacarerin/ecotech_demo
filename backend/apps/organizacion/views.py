"""API de la organización · permisos según docs/project_spec.md §4.2.

El alcance de cada rol se aplica en get_queryset: lo que un rol no puede ver no
existe para él, y pedirlo por su número responde 404, no 403.
"""
from django.db.models import Count
from rest_framework import viewsets
from rest_framework.permissions import SAFE_METHODS

from apps.nucleo.permisos import EsAdministrador, EsGerenteOAdministrador

from .models import Departamento
from .serializers import DepartamentoSerializer


def departamento_de(usuario):
    """Departamento del empleado ligado a la cuenta, o None."""
    empleado = getattr(usuario, "empleado", None)
    return empleado.departamento_id if empleado else None


class DepartamentoViewSet(viewsets.ModelViewSet):
    """Administración: todo. Gerente: solo ver el suyo. Empleado: nada."""

    serializer_class = DepartamentoSerializer

    def get_permissions(self):
        clase = EsGerenteOAdministrador if self.request.method in SAFE_METHODS else EsAdministrador
        return [clase()]

    def get_queryset(self):
        consulta = Departamento.objects.select_related("gerente").annotate(cantidad_empleados=Count("empleados"))
        if self.request.user.es_administrador:
            return consulta
        return consulta.filter(pk=departamento_de(self.request.user))
