import pytest

from .models import Usuario


@pytest.mark.django_db
def test_un_usuario_nuevo_es_empleado_por_omision():
    usuario = Usuario.objects.create_user("mrojas", password="una-clave-larga-1")
    assert usuario.rol == Usuario.Rol.EMPLEADO
    assert not usuario.es_administrador and not usuario.es_gerente


@pytest.mark.django_db
def test_la_clave_no_se_guarda_en_texto_plano():
    usuario = Usuario.objects.create_user("mrojas", password="una-clave-larga-1")
    assert usuario.password != "una-clave-larga-1"
    assert usuario.check_password("una-clave-larga-1")
