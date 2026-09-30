from rest_framework import serializers

from .models import Asignacion, Proyecto


class ProyectoSerializer(serializers.ModelSerializer):
    asignados_vigentes = serializers.IntegerField(read_only=True)

    class Meta:
        model = Proyecto
        fields = ["id", "nombre", "descripcion", "fecha_inicio", "ciudad", "pais", "latitud", "longitud",
                  "moneda", "activo", "asignados_vigentes"]


class AsignacionSerializer(serializers.ModelSerializer):
    empleado_nombre = serializers.CharField(source="empleado.nombre", read_only=True)
    proyecto_nombre = serializers.CharField(source="proyecto.nombre", read_only=True)
    vigente = serializers.BooleanField(read_only=True)

    class Meta:
        model = Asignacion
        fields = ["id", "empleado", "empleado_nombre", "proyecto", "proyecto_nombre", "desde", "hasta", "vigente"]

    def get_fields(self):
        campos = super().get_fields()
        # Una asignación existente solo se cierra: quién, dónde y desde cuándo no se reescriben
        if self.instance is not None:
            for nombre in ("empleado", "proyecto", "desde"):
                campos[nombre].read_only = True
        return campos
