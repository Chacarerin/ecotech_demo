from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register("departamentos", views.DepartamentoViewSet, basename="departamento")
router.register("empleados", views.EmpleadoViewSet, basename="empleado")

urlpatterns = router.urls
