from rest_framework import serializers

from .models import RegistroTiempo


class RegistroTiempoSerializer(serializers.ModelSerializer):
    empleado_nombre = serializers.CharField(source="empleado.nombre", read_only=True)
    proyecto_nombre = serializers.CharField(source="proyecto.nombre", read_only=True)

    class Meta:
        model = RegistroTiempo
        fields = ["id", "empleado", "empleado_nombre", "proyecto", "proyecto_nombre", "fecha", "horas",
                  "descripcion", "autor"]
        # Quién trabajó y quién registró los decide la sesión, nunca el cuerpo de la petición
        read_only_fields = ["empleado", "autor"]
