"""Rutas de la API. Todo cuelga de /api/, salvo el admin de Django y la portada."""
from django.contrib import admin
from django.urls import include, path

from apps.nucleo.views import raiz

urlpatterns = [
    path("", raiz, name="raiz"),
    path("admin/", admin.site.urls),
    path("api/", include("apps.nucleo.urls")),
    path("api/auth/", include("apps.usuarios.urls")),
    path("api/", include("apps.organizacion.urls")),
    path("api/", include("apps.proyectos.urls")),
    path("api/", include("apps.registros.urls")),
]
