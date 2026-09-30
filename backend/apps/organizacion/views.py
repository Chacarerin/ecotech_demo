"""API de la organización · permisos según docs/project_spec.md §4.2.

El alcance de cada rol se aplica en get_queryset: lo que un rol no puede ver no
existe para él, y pedirlo por su número responde 404, no 403.
"""
from django.db.models import Count, Q
from rest_framework import viewsets
from rest_framework.permissions import SAFE_METHODS

from rest_framework.permissions import IsAuthenticated

from apps.nucleo.permisos import EsAdministrador, EsGerenteOAdministrador

from .models import Departamento, Empleado
from .serializers import DepartamentoSerializer, EmpleadoDetalleSerializer, EmpleadoSerializer


def departamento_de(usuario):
    """Departamento del empleado ligado a la cuenta, o None."""
    empleado = getattr(usuario, "empleado", None)
    return empleado.departamento_id if empleado else None


def del_departamento_del_gerente(consulta, usuario, campo: str):
    """Filtra la consulta al departamento del gerente. Sin departamento, no ve nada.

    No se filtra con departamento_id=None: Django lo convierte en IS NULL y, al cruzar
    tablas, deja ver todo lo que no tiene departamento o no tiene relaciones.
    """
    depto = departamento_de(usuario)
    return consulta.none() if depto is None else consulta.filter(**{campo: depto})


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
        return del_departamento_del_gerente(consulta, self.request.user, "pk")


class EmpleadoViewSet(viewsets.ModelViewSet):
    """Administración: todo, con datos personales. Gerente: su departamento, sin ellos.
    Empleado: solo su propia ficha, con sus datos."""

    def get_permissions(self):
        return [IsAuthenticated()] if self.request.method in SAFE_METHODS else [EsAdministrador()]

    def get_queryset(self):
        usuario = self.request.user
        consulta = Empleado.objects.select_related("departamento")
        if usuario.es_administrador:
            pass
        elif usuario.es_gerente:
            consulta = del_departamento_del_gerente(consulta, usuario, "departamento_id")
        else:
            consulta = consulta.filter(usuario=usuario)

        # Búsqueda por nombre o correo: los campos cifrados no se pueden buscar
        if texto := self.request.query_params.get("q", "").strip():
            consulta = consulta.filter(Q(nombre__icontains=texto) | Q(correo__icontains=texto))
        if depto := self.request.query_params.get("departamento"):
            consulta = consulta.filter(departamento_id=depto)
        return consulta

    def get_serializer_class(self):
        usuario = self.request.user
        # El gerente nunca recibe los datos personales: no basta con ocultarlos en la interfaz
        return EmpleadoSerializer if usuario.es_gerente else EmpleadoDetalleSerializer
