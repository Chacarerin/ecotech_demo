from django.urls import path

from . import auth

urlpatterns = [
    path("token/", auth.IniciarSesion.as_view(), name="iniciar-sesion"),
    path("token/refresh/", auth.RenovarSesion.as_view(), name="renovar-sesion"),
    path("logout/", auth.CerrarSesion.as_view(), name="cerrar-sesion"),
    path("yo/", auth.UsuarioActual.as_view(), name="usuario-actual"),
]
