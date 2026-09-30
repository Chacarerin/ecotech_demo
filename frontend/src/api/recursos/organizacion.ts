import { comoJson, pedir } from '../cliente'

export interface Departamento {
  id: number
  nombre: string
  gerente: number | null
  gerenteNombre: string | null
  cantidadEmpleados: number
}

export interface Empleado {
  id: number
  nombre: string
  correo: string
  fechaInicio: string            // aaaa-mm-dd
  departamento: number | null
  departamentoNombre: string | null
  // Solo llegan a administración y al propio empleado
  direccion?: string
  telefono?: string
  salario?: number
}

export type DatosDepartamento = Pick<Departamento, 'nombre' | 'gerente'>
export type DatosEmpleado = Omit<Empleado, 'id' | 'departamentoNombre'>

const guardar = <T,>(ruta: string, datos: Record<string, unknown>, id?: number) =>
  pedir<T>(id ? `${ruta}${id}/` : ruta, { method: id ? 'PATCH' : 'POST', body: comoJson(datos) })

export const departamentos = {
  listar: () => pedir<Departamento[]>('/api/departamentos/'),
  obtener: (id: number) => pedir<Departamento>(`/api/departamentos/${id}/`),
  guardar: (datos: DatosDepartamento, id?: number) => guardar<Departamento>('/api/departamentos/', datos, id),
  eliminar: (id: number) => pedir<void>(`/api/departamentos/${id}/`, { method: 'DELETE' }),
}

export const empleados = {
  listar: (filtros: { q?: string; departamento?: number } = {}) => {
    const p = new URLSearchParams()
    if (filtros.q) p.set('q', filtros.q)
    if (filtros.departamento) p.set('departamento', String(filtros.departamento))
    return pedir<Empleado[]>(`/api/empleados/${p.size ? `?${p}` : ''}`)
  },
  obtener: (id: number) => pedir<Empleado>(`/api/empleados/${id}/`),
  guardar: (datos: DatosEmpleado, id?: number) => guardar<Empleado>('/api/empleados/', datos, id),
  eliminar: (id: number) => pedir<void>(`/api/empleados/${id}/`, { method: 'DELETE' }),
}
