import pytest
from django.core.management import call_command

from apps.organizacion.models import Departamento, Empleado
from apps.proyectos.models import Asignacion, Proyecto
from apps.registros.models import RegistroTiempo
from apps.usuarios.models import Usuario


@pytest.mark.django_db
def test_cargar_demo_se_puede_repetir_sin_duplicar():
    call_command("cargar_demo")
    call_command("cargar_demo")
    assert (Departamento.objects.count(), Empleado.objects.count(),
            Proyecto.objects.count(), Asignacion.objects.count()) == (3, 8, 4, 8)
    # Cada gerente pertenece al departamento que dirige: la regla del modelo se respetó
    assert all(d.gerente.departamento_id == d.pk for d in Departamento.objects.all())
    assert Proyecto.objects.filter(activo=False).count() == 1


@pytest.mark.django_db
def test_sin_la_variable_no_crea_cuentas(monkeypatch):
    # En el equipo de un estudiante no deben aparecer usuarios con claves conocidas
    monkeypatch.delenv("DEMO_CUENTAS", raising=False)
    call_command("cargar_demo")
    assert not Usuario.objects.exists()


@pytest.mark.django_db
def test_una_cuenta_por_rol_ligada_a_un_empleado_con_algo_que_ver(monkeypatch):
    monkeypatch.setenv("DEMO_CUENTAS", "true")
    call_command("cargar_demo")
    roles = {u.username: u.rol for u in Usuario.objects.all()}
    assert roles == {"admin": "administrador", "gerente": "gerente", "empleado": "empleado"}
    assert not Usuario.objects.filter(is_staff=True).exists()          # ninguna entra al panel de Django
    assert Empleado.objects.get(usuario__username="gerente").departamentos_a_cargo.exists()
    assert Empleado.objects.get(usuario__username="empleado").asignaciones.count() == 2


@pytest.mark.django_db
def test_restablecer_deshace_los_cambios_y_repone_las_cuentas(monkeypatch):
    monkeypatch.setenv("DEMO_CUENTAS", "true")
    call_command("cargar_demo")
    # Un visitante desordena los datos y cambia la clave de una cuenta pública
    Proyecto.objects.filter(nombre="Eólico Canela").update(nombre="Proyecto renombrado")
    cuenta = Usuario.objects.get(username="admin")
    cuenta.set_password("otra")
    cuenta.save()

    call_command("cargar_demo", restablecer=True)
    assert Proyecto.objects.filter(nombre="Eólico Canela").exists()
    assert not Proyecto.objects.filter(nombre="Proyecto renombrado").exists()
    cuenta.refresh_from_db()
    assert cuenta.check_password("admin")
    # Los empleados se recrearon: las cuentas vuelven a quedar ligadas
    assert Empleado.objects.get(usuario__username="gerente").nombre == "Marta Rojas Pizarro"


@pytest.mark.django_db
def test_carga_horas_recientes_y_restablecer_las_renueva():
    call_command("cargar_demo")
    assert RegistroTiempo.objects.exists()
    # Todas cumplen las reglas del modelo: el modelo las valida al guardar
    assert all((r.horas * 2) % 1 == 0 for r in RegistroTiempo.objects.all())
    # Con horas registradas, restablecer no choca con las claves protegidas
    call_command("cargar_demo", restablecer=True)
    assert RegistroTiempo.objects.exists()
