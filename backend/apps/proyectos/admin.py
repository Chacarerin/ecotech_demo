from django.contrib import admin

from .models import Proyecto


@admin.register(Proyecto)
class ProyectoAdmin(admin.ModelAdmin):
    list_display = ("nombre", "ciudad", "pais", "moneda", "activo")
    list_filter = ("activo", "moneda")
    search_fields = ("nombre", "ciudad")
