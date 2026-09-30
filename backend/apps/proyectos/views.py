"""API de proyectos y asignaciones · permisos según docs/project_spec.md §4.2."""
from django.db.models import Count, Q
from django.utils import timezone
from rest_framework import viewsets
from rest_framework.permissions import SAFE_METHODS, IsAuthenticated

from apps.nucleo.permisos import EsAdministrador
from apps.organizacion.views import departamento_de

from .models import Proyecto
from .serializers import ProyectoSerializer


def vigente(prefijo: str = "") -> Q:
    """Condición de asignación vigente, para usar en filtros y anotaciones."""
    hoy = timezone.localdate()
    return Q(**{f"{prefijo}hasta__isnull": True}) | Q(**{f"{prefijo}hasta__gte": hoy})


class ProyectoViewSet(viewsets.ModelViewSet):
    """Administración: todo. Gerente: los proyectos con gente de su departamento.
    Empleado: los proyectos en que está asignado. Nadie elimina: se desactiva."""

    serializer_class = ProyectoSerializer
    http_method_names = ["get", "post", "put", "patch", "head", "options"]   # sin DELETE

    def get_permissions(self):
        return [IsAuthenticated()] if self.request.method in SAFE_METHODS else [EsAdministrador()]

    def get_queryset(self):
        usuario = self.request.user
        consulta = Proyecto.objects.annotate(
            asignados_vigentes=Count("asignaciones", filter=vigente("asignaciones__"), distinct=True))
        if usuario.es_gerente:
            consulta = consulta.filter(asignaciones__empleado__departamento_id=departamento_de(usuario))
        elif not usuario.es_administrador:
            consulta = consulta.filter(asignaciones__empleado__usuario=usuario)

        if texto := self.request.query_params.get("q", "").strip():
            consulta = consulta.filter(Q(nombre__icontains=texto) | Q(ciudad__icontains=texto))
        if (activo := self.request.query_params.get("activo")) in ("true", "false"):
            consulta = consulta.filter(activo=activo == "true")
        return consulta.distinct()
