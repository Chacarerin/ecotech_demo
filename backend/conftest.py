import pytest
from django.core.cache import cache


@pytest.fixture(autouse=True)
def cache_limpio():
    """Cada prueba parte con el contador de intentos en cero."""
    cache.clear()
    yield
    cache.clear()
