from django.urls import path

from . import auth

urlpatterns = [
    path("token/", auth.IniciarSesion.as_view(), name="iniciar-sesion"),
]
