from django.contrib import admin

from .models import RegistroTiempo


@admin.register(RegistroTiempo)
class RegistroTiempoAdmin(admin.ModelAdmin):
    list_display = ("fecha", "empleado", "proyecto", "horas", "autor")
    list_filter = ("proyecto",)
    date_hierarchy = "fecha"
