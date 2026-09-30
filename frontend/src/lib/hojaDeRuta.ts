/**
 * Hoja de ruta del proyecto, tal como está en docs/project_status.md §2. Se muestra en el panel
 * para que quien recorre la demostración sepa qué está listo y qué falta.
 *
 * ⚠️ Se actualiza a mano al cerrar cada hito, en el mismo commit que actualiza project_status.md.
 */
export type EstadoHito = 'listo' | 'proximo' | 'pendiente'

export interface Hito {
  numero: number
  nombre: string
  detalle: string
  estado: EstadoHito
}

export const HITOS: Hito[] = [
  { numero: 1, nombre: 'Esqueleto', detalle: 'Django, React, PostgreSQL y CI', estado: 'listo' },
  { numero: 2, nombre: 'Autenticación y roles', detalle: 'JWT, tres roles y rutas protegidas', estado: 'listo' },
  { numero: 3, nombre: 'Organización', detalle: 'Departamentos y empleados con datos cifrados', estado: 'listo' },
  { numero: 4, nombre: 'Proyectos', detalle: 'Proyectos y asignaciones con vigencia', estado: 'listo' },
  { numero: 8, nombre: 'En línea', detalle: 'Deploy automático tras la CI en verde', estado: 'listo' },
  { numero: 5, nombre: 'Registro de horas', detalle: 'Horas por proyecto, con tope diario', estado: 'proximo' },
  { numero: 6, nombre: 'Reportes', detalle: 'Informes exportables a CSV y Excel', estado: 'pendiente' },
  { numero: 7, nombre: 'Integraciones', detalle: 'Clima del proyecto y tipo de cambio', estado: 'pendiente' },
]

export const REPOSITORIO = 'https://github.com/Chacarerin/ecotech_demo'

export const avance = () => Math.round((HITOS.filter((h) => h.estado === 'listo').length / HITOS.length) * 100)
