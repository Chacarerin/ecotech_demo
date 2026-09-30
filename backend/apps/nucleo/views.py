"""Infraestructura común de la API. Sin lógica de negocio."""
from django.db import DatabaseError, connection
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response


@api_view(["GET"])
@permission_classes([AllowAny])
def health(request):
    """Estado del servicio y de la base de datos.

    Lo consulta la verificación posterior a cada deploy. Es público, así que no
    entrega versiones, nombres de host ni el texto del error: solo «ok» o «error».
    """
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        base = "ok"
    except DatabaseError:
        base = "error"
    estado = "ok" if base == "ok" else "degradado"
    return Response({"estado": estado, "base": base}, status=200 if base == "ok" else 503)


@api_view(["GET"])
@permission_classes([AllowAny])
def raiz(request):
    """Portada de la API. Sin ella, quien abre el dominio en el navegador ve «Not Found» y cree
    que el servicio está caído: la API responde bajo /api/, no en la raíz."""
    return Response({
        "servicio": "API de EcoTech Solutions · demostración académica",
        "interfaz": "https://ecotech.antostudio.cl",
        "estado": "/api/health/",
        "codigo": "https://github.com/Chacarerin/ecotech_demo",
    })
