from rest_framework import serializers

from .models import Usuario


class UsuarioActualSerializer(serializers.ModelSerializer):
    """Lo que la interfaz necesita saber del usuario con sesión, y nada más."""

    nombre = serializers.SerializerMethodField()

    class Meta:
        model = Usuario
        fields = ["id", "username", "nombre", "rol"]

    def get_nombre(self, usuario: Usuario) -> str:
        return usuario.get_full_name() or usuario.username
