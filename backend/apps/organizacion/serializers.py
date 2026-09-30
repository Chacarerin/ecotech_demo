from rest_framework import serializers

from .models import Departamento


class DepartamentoSerializer(serializers.ModelSerializer):
    gerente_nombre = serializers.CharField(source="gerente.nombre", read_only=True, default=None)
    cantidad_empleados = serializers.IntegerField(read_only=True)

    class Meta:
        model = Departamento
        fields = ["id", "nombre", "gerente", "gerente_nombre", "cantidad_empleados"]
