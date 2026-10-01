"""API de horas · permisos según docs/project_spec.md §4.2 y docs/architecture.md §4.

Empleado: crea, edita y elimina las suyas, solo de los últimos 7 días.
Gerente: ve las de su departamento. Administración: ve todas. Ninguno de los dos escribe:
las horas las declara quien las trabajó.
"""
from datetime import timedelta

from django.utils import timezone
from rest_framework import viewsets
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.permissions import SAFE_METHODS, IsAuthenticated

from apps.nucleo.permisos import EsEmpleado
from apps.organizacion.views import del_departamento_del_gerente

from .models import RegistroTiempo
from .serializers import RegistroTiempoSerializer

VENTANA_DIAS = 7
FUERA_DE_PLAZO = "Solo se pueden registrar, editar o eliminar horas de los últimos 7 días."


def dentro_de_plazo(fecha) -> bool:
    return fecha >= timezone.localdate() - timedelta(days=VENTANA_DIAS)


class RegistroTiempoViewSet(viewsets.ModelViewSet):
    serializer_class = RegistroTiempoSerializer

    def get_permissions(self):
        return [IsAuthenticated()] if self.request.method in SAFE_METHODS else [EsEmpleado()]

    def get_queryset(self):
        usuario = self.request.user
        consulta = RegistroTiempo.objects.select_related("empleado", "proyecto")
        if usuario.es_gerente:
            consulta = del_departamento_del_gerente(consulta, usuario, "empleado__departamento_id")
        elif not usuario.es_administrador:
            consulta = consulta.filter(empleado__usuario=usuario)

        filtros = self.request.query_params
        if desde := filtros.get("desde"):
            consulta = consulta.filter(fecha__gte=desde)
        if hasta := filtros.get("hasta"):
            consulta = consulta.filter(fecha__lte=hasta)
        for campo in ("proyecto", "empleado"):
            if valor := filtros.get(campo):
                consulta = consulta.filter(**{f"{campo}_id": valor})
        return consulta

    def _empleado_de_la_sesion(self):
        empleado = getattr(self.request.user, "empleado", None)
        if empleado is None:
            raise PermissionDenied("Su cuenta no está asociada a un empleado.")
        return empleado

    def _exigir_plazo(self, fecha):
        if fecha and not dentro_de_plazo(fecha):
            raise ValidationError({"fecha": [FUERA_DE_PLAZO]})

    def perform_create(self, serializer):
        self._exigir_plazo(serializer.validated_data.get("fecha"))
        serializer.save(empleado=self._empleado_de_la_sesion(), autor=self.request.user)

    def perform_update(self, serializer):
        # Se exige el plazo para la fecha que tenía y para la que pasa a tener
        self._exigir_plazo(serializer.instance.fecha)
        self._exigir_plazo(serializer.validated_data.get("fecha"))
        serializer.save()

    def perform_destroy(self, instance):
        self._exigir_plazo(instance.fecha)
        instance.delete()
