import pytest
from cryptography.fernet import Fernet
from django.core.exceptions import ImproperlyConfigured

from apps.nucleo import campos
from apps.nucleo.campos import CampoCifrado


def test_el_valor_se_guarda_cifrado_y_se_lee_con_su_tipo():
    salario = CampoCifrado(tipo=int)
    en_la_base = salario.get_prep_value(1250000)
    assert "1250000" not in en_la_base
    assert salario.from_db_value(en_la_base, None, None) == 1250000


def test_cifrar_dos_veces_el_mismo_valor_da_textos_distintos():
    # Por eso un campo cifrado no se puede buscar en la base: es deliberado
    telefono = CampoCifrado()
    assert telefono.get_prep_value("+56 9 8765 4321") != telefono.get_prep_value("+56 9 8765 4321")


def test_vacio_y_nulo_no_se_cifran():
    campo = CampoCifrado()
    assert campo.get_prep_value(None) is None
    assert campo.get_prep_value("") == ""


def test_con_otra_clave_falla_de_forma_visible(settings):
    campo = CampoCifrado()
    cifrado = campo.get_prep_value("Av. Brasil 1234, Valparaíso")
    settings.FIELD_ENCRYPTION_KEY = Fernet.generate_key().decode()
    campos._fernet.cache_clear()
    try:
        with pytest.raises(ImproperlyConfigured, match="no es la clave"):
            campo.from_db_value(cifrado, None, None)
    finally:
        campos._fernet.cache_clear()
