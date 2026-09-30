from datetime import timedelta

import pytest
from django.core.exceptions import ValidationError
from django.utils import timezone

from apps.nucleo.validadores import NoFutura, telefono_chileno


@pytest.mark.parametrize("valido", ["+56 9 8765 4321", "+56987654321", "+56 987654321"])
def test_telefonos_validos(valido):
    telefono_chileno(valido)


@pytest.mark.parametrize("invalido", ["987654321", "+56 2 2345 6789", "+56 9 8765 432", "+1 9 8765 4321", ""])
def test_telefonos_invalidos(invalido):
    with pytest.raises(ValidationError, match="formato"):
        telefono_chileno(invalido)


def test_fecha_de_hoy_es_valida_y_la_de_manana_no():
    hoy = timezone.localdate()
    validador = NoFutura("La fecha de inicio no puede ser futura.")
    validador(hoy)
    with pytest.raises(ValidationError, match="La fecha de inicio no puede ser futura."):
        validador(hoy + timedelta(days=1))
