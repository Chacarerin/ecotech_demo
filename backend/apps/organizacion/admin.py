from django.contrib import admin

from .models import Departamento, Empleado


@admin.register(Departamento)
class DepartamentoAdmin(admin.ModelAdmin):
    list_display = ("nombre", "gerente")
    search_fields = ("nombre",)


@admin.register(Empleado)
class EmpleadoAdmin(admin.ModelAdmin):
    # Los campos cifrados se muestran descifrados en el formulario, no en el listado
    list_display = ("nombre", "correo", "departamento", "fecha_inicio")
    list_filter = ("departamento",)
    search_fields = ("nombre", "correo")
