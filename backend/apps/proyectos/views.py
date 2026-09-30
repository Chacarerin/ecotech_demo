"""API de proyectos y asignaciones · permisos según docs/project_spec.md §4.2."""
from django.db.models import Count, Q
from django.utils import timezone
from rest_framework import viewsets
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import SAFE_METHODS, IsAuthenticated

from apps.nucleo.permisos import EsAdministrador, EsGerenteOAdministrador
from apps.organizacion.views import del_departamento_del_gerente, departamento_de

from .models import Asignacion, Proyecto
from .serializers import AsignacionSerializer, ProyectoSerializer


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
            consulta = del_departamento_del_gerente(consulta, usuario, "asignaciones__empleado__departamento_id")
        elif not usuario.es_administrador:
            consulta = consulta.filter(asignaciones__empleado__usuario=usuario)

        if texto := self.request.query_params.get("q", "").strip():
            consulta = consulta.filter(Q(nombre__icontains=texto) | Q(ciudad__icontains=texto))
        if (activo := self.request.query_params.get("activo")) in ("true", "false"):
            consulta = consulta.filter(activo=activo == "true")
        return consulta.distinct()


class AsignacionViewSet(viewsets.ModelViewSet):
    """Administración: todas. Gerente: las de su departamento, y solo con su gente.
    Empleado: consulta las suyas. Cerrar es PATCH con «hasta»; anular es DELETE."""

    serializer_class = AsignacionSerializer

    def get_permissions(self):
        return [IsAuthenticated()] if self.request.method in SAFE_METHODS else [EsGerenteOAdministrador()]

    def get_queryset(self):
        usuario = self.request.user
        consulta = Asignacion.objects.select_related("empleado", "proyecto")
        if usuario.es_gerente:
            consulta = del_departamento_del_gerente(consulta, usuario, "empleado__departamento_id")
        elif not usuario.es_administrador:
            consulta = consulta.filter(empleado__usuario=usuario)
        for filtro in ("proyecto", "empleado"):
            if valor := self.request.query_params.get(filtro):
                consulta = consulta.filter(**{f"{filtro}_id": valor})
        if self.request.query_params.get("vigentes") == "true":
            consulta = consulta.filter(vigente())
        return consulta

    def perform_create(self, serializer):
        usuario = self.request.user
        empleado = serializer.validated_data["empleado"]
        # El gerente asigna solo a su gente: se verifica aunque la interfaz no le muestre a otros
        if usuario.es_gerente and empleado.departamento_id != departamento_de(usuario):
            raise PermissionDenied("Solo puede asignar empleados de su departamento.")
        serializer.save()
