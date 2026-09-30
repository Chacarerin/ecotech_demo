"""Campo de modelo cifrado · docs/architecture.md §3.2.

Encapsulamiento aplicado: el resto del sistema escribe `empleado.salario = 1250000`
y lee un número, sin saber que en la base queda un texto cifrado con Fernet
(AES-128 con autenticación). Cifrar, descifrar y convertir el tipo ocurre aquí y en
ningún otro lugar.

Consecuencia de diseño: un campo cifrado no se puede filtrar, ordenar ni comparar en
la base, porque cada cifrado del mismo valor produce un texto distinto. Por eso solo
se cifra lo que no se busca: dirección, teléfono y salario.
"""
from functools import lru_cache

from cryptography.fernet import Fernet, InvalidToken
from django.conf import settings
from django.core.exceptions import ImproperlyConfigured
from django.db import models


@lru_cache(maxsize=1)
def _fernet() -> Fernet:
    try:
        return Fernet(settings.FIELD_ENCRYPTION_KEY)
    except (ValueError, TypeError) as exc:
        raise ImproperlyConfigured("FIELD_ENCRYPTION_KEY no es una clave Fernet válida.") from exc


class CampoCifrado(models.TextField):
    """Guarda el valor cifrado; lo entrega descifrado y con su tipo original.

    `tipo` es la conversión que se aplica al leer: `str` para textos, `int` para montos.
    """

    def __init__(self, *args, tipo=str, **kwargs):
        self.tipo = tipo
        super().__init__(*args, **kwargs)

    def deconstruct(self):
        nombre, ruta, args, kwargs = super().deconstruct()
        if self.tipo is not str:
            kwargs["tipo"] = self.tipo
        return nombre, ruta, args, kwargs

    # objeto → base de datos
    def get_prep_value(self, valor):
        if valor is None or valor == "":
            return valor
        return _fernet().encrypt(str(valor).encode()).decode()

    # base de datos → objeto
    def from_db_value(self, valor, expression, connection):
        if valor is None or valor == "":
            return valor
        try:
            return self.tipo(_fernet().decrypt(valor.encode()).decode())
        except InvalidToken as exc:
            # Nunca devolver el texto cifrado como si fuera el dato: falla de forma visible
            raise ImproperlyConfigured(
                "No se pudo descifrar un dato: FIELD_ENCRYPTION_KEY no es la clave con que se cifró."
            ) from exc

    def to_python(self, valor):
        if valor is None or valor == "" or isinstance(valor, self.tipo):
            return valor
        return self.tipo(valor)
