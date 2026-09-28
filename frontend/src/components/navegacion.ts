import { BarChart3, Building2, Clock, FolderKanban, LayoutDashboard, Users, type LucideIcon } from 'lucide-react'

import type { Rol } from '../api/recursos/auth'

export interface Modulo {
  ruta: string
  nombre: string
  icono: LucideIcon            // un icono por concepto, el mismo en toda la aplicación · CLAUDE.md §7
  roles: Rol[]
  hito?: number                // hito en que se construye; sin hito, ya está disponible
}

/** Una sola fuente para la navegación y las rutas: lo que se ve y lo que se protege coinciden. */
export const MODULOS: Modulo[] = [
  { ruta: '/', nombre: 'Panel', icono: LayoutDashboard, roles: ['administrador', 'gerente', 'empleado'] },
  { ruta: '/empleados', nombre: 'Empleados', icono: Users, roles: ['administrador'], hito: 3 },
  { ruta: '/departamentos', nombre: 'Departamentos', icono: Building2, roles: ['administrador'], hito: 3 },
  { ruta: '/proyectos', nombre: 'Proyectos', icono: FolderKanban, roles: ['administrador', 'gerente'], hito: 4 },
  { ruta: '/horas', nombre: 'Horas', icono: Clock, roles: ['administrador', 'gerente', 'empleado'], hito: 5 },
  { ruta: '/reportes', nombre: 'Reportes', icono: BarChart3, roles: ['administrador', 'gerente'], hito: 6 },
]
