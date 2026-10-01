from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register("registros", views.RegistroTiempoViewSet, basename="registro")

urlpatterns = router.urls
