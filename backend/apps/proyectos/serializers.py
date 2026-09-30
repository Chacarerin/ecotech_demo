from rest_framework import serializers

from .models import Proyecto


class ProyectoSerializer(serializers.ModelSerializer):
    asignados_vigentes = serializers.IntegerField(read_only=True)

    class Meta:
        model = Proyecto
        fields = ["id", "nombre", "descripcion", "fecha_inicio", "ciudad", "pais", "latitud", "longitud",
                  "moneda", "activo", "asignados_vigentes"]
