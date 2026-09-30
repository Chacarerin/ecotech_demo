"""Rutas de la API. Todo cuelga de /api/, salvo el admin de Django."""
from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("apps.nucleo.urls")),
    path("api/auth/", include("apps.usuarios.urls")),
    path("api/", include("apps.organizacion.urls")),
]
