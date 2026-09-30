import type { Rol } from '../api/recursos/auth'

export const NOMBRE_ROL: Record<Rol, string> = { administrador: 'Administración', gerente: 'Gerencia', empleado: 'Empleado' }

/** «Marta Rojas Pizarro» → «MR» */
export const iniciales = (nombre = '') =>
  nombre
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('')

/** Saludo según la hora del navegador. */
export function saludo(hora = new Date().getHours()) {
  if (hora < 12) return 'Buenos días'
  if (hora < 20) return 'Buenas tardes'
  return 'Buenas noches'
}
