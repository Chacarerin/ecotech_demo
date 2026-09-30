"""Carga datos ficticios del caso EcoTech para mostrar la aplicación con contenido.

    python manage.py cargar_demo

Se puede ejecutar más de una vez: identifica cada registro por su nombre o su correo y no
duplica nada. No crea cuentas de usuario: esas las crea la administración, con sus claves.
Los correos usan el dominio reservado example.cl y ninguna persona existe.
"""
from datetime import date
from decimal import Decimal

from django.core.management.base import BaseCommand
from django.db import transaction

from apps.organizacion.models import Departamento, Empleado
from apps.proyectos.models import Asignacion, Proyecto

DEPARTAMENTOS = ["Desarrollo Sostenible", "Operaciones", "Finanzas"]

# nombre, correo, departamento, fecha de inicio, salario, teléfono, ¿gerente?
EMPLEADOS = [
    ("Marta Rojas Pizarro", "m.rojas", "Desarrollo Sostenible", date(2021, 3, 1), 2_400_000, "+56 9 5123 4401", True),
    ("Diego Fuentes Vera", "d.fuentes", "Desarrollo Sostenible", date(2023, 6, 12), 1_450_000, "+56 9 5123 4402", False),
    ("Camila Soto Araya", "c.soto", "Desarrollo Sostenible", date(2024, 1, 8), 1_300_000, "+56 9 5123 4403", False),
    ("Javier Silva Muñoz", "j.silva", "Operaciones", date(2020, 9, 14), 2_150_000, "+56 9 5123 4404", True),
    ("Paula Cortés Reyes", "p.cortes", "Operaciones", date(2025, 2, 3), 950_000, "+56 9 5123 4405", False),
    ("Tomás Herrera Lagos", "t.herrera", "Operaciones", date(2022, 11, 21), 1_150_000, "+56 9 5123 4406", False),
    ("Valentina Núñez Olave", "v.nunez", "Finanzas", date(2019, 5, 6), 2_300_000, "+56 9 5123 4407", True),
    ("Ignacio Paredes Toro", "i.paredes", "Finanzas", date(2024, 8, 19), 1_250_000, "+56 9 5123 4408", False),
]

# nombre, ciudad, país, latitud, longitud, moneda, inicio, activo, integrantes
PROYECTOS = [
    ("Parque Solar Llay-Llay", "Llay-Llay", "Chile", "-32.84150", "-70.95600", "CLP", date(2026, 4, 1), True,
     ["d.fuentes", "p.cortes", "t.herrera"]),
    ("Eólico Canela", "Canela", "Chile", "-31.39800", "-71.45700", "CLP", date(2026, 7, 15), True,
     ["c.soto", "t.herrera"]),
    ("Hidrógeno Verde Mendoza", "Mendoza", "Argentina", "-32.88950", "-68.84580", "USD", date(2026, 9, 1), True,
     ["d.fuentes", "i.paredes"]),
    ("Auditoría Energética Valencia", "Valencia", "España", "39.46990", "-0.37630", "EUR", date(2025, 10, 1), False,
     ["c.soto"]),
]


class Command(BaseCommand):
    help = "Carga departamentos, empleados, proyectos y asignaciones ficticios del caso EcoTech."

    @transaction.atomic
    def handle(self, *args, **opciones):
        deptos = {n: Departamento.objects.get_or_create(nombre=n)[0] for n in DEPARTAMENTOS}

        empleados = {}
        for nombre, usuario, depto, inicio, salario, telefono, gerente in EMPLEADOS:
            empleado = Empleado.objects.filter(correo=f"{usuario}@example.cl").first() or Empleado(
                nombre=nombre, correo=f"{usuario}@example.cl", fecha_inicio=inicio, salario=salario,
                telefono=telefono, direccion="Av. Brasil 2950, Valparaíso", departamento=deptos[depto])
            empleado.save()
            empleados[usuario] = empleado
            if gerente and deptos[depto].gerente_id is None:
                deptos[depto].gerente = empleado
                deptos[depto].save()

        for nombre, ciudad, pais, lat, lon, moneda, inicio, activo, integrantes in PROYECTOS:
            proyecto, creado = Proyecto.objects.get_or_create(nombre=nombre, defaults=dict(
                ciudad=ciudad, pais=pais, latitud=Decimal(lat), longitud=Decimal(lon),
                moneda=moneda, fecha_inicio=inicio))
            if creado:
                # Se asigna antes de desactivar: un proyecto inactivo no admite asignaciones nuevas
                for usuario in integrantes:
                    Asignacion.objects.create(empleado=empleados[usuario], proyecto=proyecto, desde=inicio)
                if not activo:
                    proyecto.activo = False
                    proyecto.save()

        self.stdout.write(self.style.SUCCESS(
            f"Datos de demostración: {Departamento.objects.count()} departamentos, "
            f"{Empleado.objects.count()} empleados, {Proyecto.objects.count()} proyectos, "
            f"{Asignacion.objects.count()} asignaciones."))
