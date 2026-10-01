import { BarChart3, Building2, Clock, FolderKanban, LayoutDashboard, Users, type LucideIcon } from 'lucide-react'

import type { Rol } from '../api/recursos/auth'

export interface Modulo {
  ruta: string
  nombre: string
  nombreCorto?: string         // para la barra inferior del celular, donde caben seis a 320 px
  icono: LucideIcon            // un icono por concepto, el mismo en toda la aplicación · CLAUDE.md §7
  descripcion: string          // una línea, para la tarjeta de acceso del panel
  roles: Rol[]
  hito?: number                // hito en que se construye; sin hito, ya está disponible
}

/** Una sola fuente para la navegación y las rutas: lo que se ve y lo que se protege coinciden. */
export const MODULOS: Modulo[] = [
  { ruta: '/', nombre: 'Panel', descripcion: 'Resumen de la organización', icono: LayoutDashboard, roles: ['administrador', 'gerente', 'empleado'] },
  { ruta: '/empleados', nombre: 'Empleados', nombreCorto: 'Personal', descripcion: 'Fichas, datos personales cifrados y departamento', icono: Users, roles: ['administrador'] },
  { ruta: '/departamentos', nombre: 'Departamentos', nombreCorto: 'Deptos.', descripcion: 'Áreas de la empresa y su gerente', icono: Building2, roles: ['administrador'] },
  { ruta: '/proyectos', nombre: 'Proyectos', descripcion: 'Ubicación, moneda y quién trabaja en cada uno', icono: FolderKanban, roles: ['administrador', 'gerente'] },
  { ruta: '/horas', nombre: 'Horas', descripcion: 'Registro diario de horas por proyecto', icono: Clock, roles: ['administrador', 'gerente', 'empleado'] },
  { ruta: '/reportes', nombre: 'Reportes', descripcion: 'Informes exportables a CSV y Excel', icono: BarChart3, roles: ['administrador', 'gerente'], hito: 6 },
]
