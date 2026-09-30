from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register("proyectos", views.ProyectoViewSet, basename="proyecto")
router.register("asignaciones", views.AsignacionViewSet, basename="asignacion")

urlpatterns = router.urls
