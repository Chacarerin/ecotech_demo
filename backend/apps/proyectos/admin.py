from django.contrib import admin

from .models import Asignacion, Proyecto


@admin.register(Proyecto)
class ProyectoAdmin(admin.ModelAdmin):
    list_display = ("nombre", "ciudad", "pais", "moneda", "activo")
    list_filter = ("activo", "moneda")
    search_fields = ("nombre", "ciudad")

    def has_delete_permission(self, request, obj=None):
        return False      # se desactiva con la casilla «activo»; ver Proyecto.delete


@admin.register(Asignacion)
class AsignacionAdmin(admin.ModelAdmin):
    list_display = ("empleado", "proyecto", "desde", "hasta")
    list_filter = ("proyecto",)
