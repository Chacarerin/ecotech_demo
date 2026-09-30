from rest_framework import serializers
from rest_framework.validators import UniqueValidator

from .models import Departamento, Empleado


class DepartamentoSerializer(serializers.ModelSerializer):
    gerente_nombre = serializers.CharField(source="gerente.nombre", read_only=True, default=None)
    cantidad_empleados = serializers.IntegerField(read_only=True)

    class Meta:
        model = Departamento
        fields = ["id", "nombre", "gerente", "gerente_nombre", "cantidad_empleados"]


class EmpleadoSerializer(serializers.ModelSerializer):
    """Lo que puede ver un gerente: sin dirección, teléfono ni salario."""

    departamento_nombre = serializers.CharField(source="departamento.nombre", read_only=True, default=None)

    class Meta:
        model = Empleado
        fields = ["id", "nombre", "correo", "fecha_inicio", "departamento", "departamento_nombre"]
        extra_kwargs = {"correo": {"validators": [UniqueValidator(
            queryset=Empleado.objects.all(), message="Ya existe un empleado con ese correo.")]}}


class EmpleadoDetalleSerializer(EmpleadoSerializer):
    """Con los datos personales: solo para administración y para el propio empleado."""

    # CampoCifrado hereda de TextField, y DRF elegiría un campo de texto: el salario
    # saldría entre comillas y su validación de mínimo compararía texto con número.
    salario = serializers.IntegerField(
        min_value=1, error_messages={"min_value": "El salario debe ser mayor que cero."})

    class Meta(EmpleadoSerializer.Meta):
        fields = EmpleadoSerializer.Meta.fields + ["direccion", "telefono", "salario"]
