"""Carga datos ficticios del caso EcoTech para mostrar la aplicación con contenido.

    python manage.py cargar_demo                 # agrega lo que falte
    python manage.py cargar_demo --restablecer   # borra los datos del caso y los vuelve a cargar

Se puede ejecutar más de una vez: identifica cada registro por su nombre o su correo y no
duplica nada. Los correos usan el dominio reservado example.cl y ninguna persona existe.

Si el .env define DEMO_CUENTAS=true, además deja listas las tres cuentas públicas de la
demostración, una por rol, con la clave igual al usuario. Se reponen en cada ejecución, aunque
alguien haya cambiado algo. Ninguna entra al panel de Django. Sin esa variable no crea cuentas:
en el equipo de un estudiante no aparecen usuarios con claves conocidas.
"""
import os
from datetime import date, timedelta
from decimal import ROUND_HALF_UP, Decimal

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from apps.organizacion.models import Departamento, Empleado
from apps.proyectos.models import Asignacion, Proyecto
from apps.registros.models import RegistroTiempo
from apps.usuarios.models import Usuario

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

# Cuentas públicas: usuario (= clave), rol y a qué empleado ficticio representa. El gerente dirige
# Desarrollo Sostenible y el empleado trabaja en dos proyectos, para que cada rol vea algo propio.
CUENTAS = [
    ("admin", Usuario.Rol.ADMINISTRADOR, None),
    ("gerente", Usuario.Rol.GERENTE, "m.rojas"),
    ("empleado", Usuario.Rol.EMPLEADO, "d.fuentes"),
]


class Command(BaseCommand):
    help = "Carga departamentos, empleados, proyectos y asignaciones ficticios del caso EcoTech."

    def add_arguments(self, parser):
        parser.add_argument("--restablecer", action="store_true",
                            help="Borra los datos del caso antes de cargarlos. Las cuentas se conservan.")

    @transaction.atomic
    def handle(self, *args, **opciones):
        if opciones["restablecer"]:
            # En orden inverso a las dependencias: las horas protegen a proyectos y empleados,
            # y las asignaciones también
            RegistroTiempo.objects.all().delete()
            Asignacion.objects.all().delete()
            Proyecto.objects.all().delete()
            Departamento.objects.update(gerente=None)
            Empleado.objects.all().delete()
            Departamento.objects.all().delete()

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

        if not RegistroTiempo.objects.exists():
            self.horas_de_la_semana()

        if os.environ.get("DEMO_CUENTAS", "").lower() == "true":
            self.cuentas_demo(empleados)

        self.stdout.write(self.style.SUCCESS(
            f"Datos de demostración: {Departamento.objects.count()} departamentos, "
            f"{Empleado.objects.count()} empleados, {Proyecto.objects.count()} proyectos, "
            f"{Asignacion.objects.count()} asignaciones, {RegistroTiempo.objects.count()} registros de horas."))

    def cuentas_demo(self, empleados):
        for usuario, rol, empleado in CUENTAS:
            cuenta, _ = Usuario.objects.get_or_create(username=usuario)
            cuenta.rol = rol
            cuenta.is_staff = cuenta.is_superuser = False      # la aplicación sí; el panel de Django no
            cuenta.is_active = True
            cuenta.set_password(usuario)
            cuenta.save()
            if empleado:
                Empleado.objects.filter(usuario=cuenta).exclude(pk=empleados[empleado].pk).update(usuario=None)
                empleados[empleado].usuario = cuenta
                empleados[empleado].save()
        self.stdout.write("Cuentas de demostración listas: " + ", ".join(c[0] for c in CUENTAS))

    def horas_de_la_semana(self):
        """Horas de los últimos días hábiles, relativas a hoy: el restablecimiento nocturno las
        renueva, de modo que la demostración siempre tiene horas recientes y editables."""
        hoy = timezone.localdate()          # el mismo «hoy» con que el modelo rechaza fechas futuras
        dias = [hoy - timedelta(days=n) for n in range(1, 8) if (hoy - timedelta(days=n)).weekday() < 5]
        jornada = [Decimal("8"), Decimal("7.5"), Decimal("8"), Decimal("6.5"), Decimal("8")]
        tareas = ["Montaje de estructuras", "Inspección de terreno", "Informe de avance",
                  "Coordinación con el cliente", "Pruebas de rendimiento"]
        activas = (Asignacion.objects.filter(proyecto__activo=True, hasta__isnull=True)
                   .select_related("empleado", "proyecto").order_by("empleado_id", "proyecto_id"))
        por_empleado = {}
        for a in activas:
            por_empleado.setdefault(a.empleado, []).append(a)
        for empleado, asignaciones in por_empleado.items():
            for i, dia in enumerate(dias):
                vigentes = [a for a in asignaciones if a.desde <= dia]
                if not vigentes:
                    continue
                # Quien está en dos proyectos reparte la jornada entre ambos
                parte = (jornada[i % len(jornada)] * 2 / len(vigentes)).quantize(Decimal("1"), ROUND_HALF_UP) / 2
                for a in vigentes:
                    RegistroTiempo.objects.create(empleado=empleado, proyecto=a.proyecto, fecha=dia, horas=parte,
                                                  descripcion=tareas[(i + a.proyecto_id) % len(tareas)])
