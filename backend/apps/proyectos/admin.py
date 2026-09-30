from django.contrib import admin

from .models import Asignacion, Proyecto


@admin.register(Proyecto)
class ProyectoAdmin(admin.ModelAdmin):
    list_display = ("nombre", "ciudad", "pais", "moneda", "activo")
    list_filter = ("activo", "moneda")
    search_fields = ("nombre", "ciudad")


@admin.register(Asignacion)
class AsignacionAdmin(admin.ModelAdmin):
    list_display = ("empleado", "proyecto", "desde", "hasta")
    list_filter = ("proyecto",)
