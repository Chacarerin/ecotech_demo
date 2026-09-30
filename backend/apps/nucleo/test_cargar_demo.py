import pytest
from django.core.management import call_command

from apps.organizacion.models import Departamento, Empleado
from apps.proyectos.models import Asignacion, Proyecto


@pytest.mark.django_db
def test_cargar_demo_se_puede_repetir_sin_duplicar():
    call_command("cargar_demo")
    call_command("cargar_demo")
    assert (Departamento.objects.count(), Empleado.objects.count(),
            Proyecto.objects.count(), Asignacion.objects.count()) == (3, 8, 4, 8)
    # Cada gerente pertenece al departamento que dirige: la regla del modelo se respetó
    assert all(d.gerente.departamento_id == d.pk for d in Departamento.objects.all())
    assert Proyecto.objects.filter(activo=False).count() == 1
