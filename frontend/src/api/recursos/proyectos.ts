import { comoJson, pedir } from '../cliente'

export type Moneda = 'CLP' | 'USD' | 'EUR'

export interface Proyecto {
  id: number
  nombre: string
  descripcion: string
  fechaInicio: string
  ciudad: string
  pais: string
  latitud: string | null         // DRF entrega los decimales como texto, sin perder precisión
  longitud: string | null
  moneda: Moneda
  activo: boolean
  asignadosVigentes: number
}

export interface Asignacion {
  id: number
  empleado: number
  empleadoNombre: string
  proyecto: number
  proyectoNombre: string
  desde: string
  hasta: string | null
  vigente: boolean
}

export type DatosProyecto = Omit<Proyecto, 'id' | 'asignadosVigentes'>

export const proyectos = {
  listar: (filtros: { q?: string; activo?: boolean } = {}) => {
    const p = new URLSearchParams()
    if (filtros.q) p.set('q', filtros.q)
    if (filtros.activo !== undefined) p.set('activo', String(filtros.activo))
    return pedir<Proyecto[]>(`/api/proyectos/${p.size ? `?${p}` : ''}`)
  },
  obtener: (id: number) => pedir<Proyecto>(`/api/proyectos/${id}/`),
  guardar: (datos: DatosProyecto, id?: number) =>
    pedir<Proyecto>(id ? `/api/proyectos/${id}/` : '/api/proyectos/', {
      method: id ? 'PATCH' : 'POST',
      body: comoJson(datos),
    }),
}

export const asignaciones = {
  vigentes: () => pedir<Asignacion[]>('/api/asignaciones/?vigentes=true'),
  delProyecto: (proyecto: number) => pedir<Asignacion[]>(`/api/asignaciones/?proyecto=${proyecto}`),
  crear: (empleado: number, proyecto: number) =>
    pedir<Asignacion>('/api/asignaciones/', { method: 'POST', body: comoJson({ empleado, proyecto }) }),
  cerrar: (id: number, hasta: string) =>
    pedir<Asignacion>(`/api/asignaciones/${id}/`, { method: 'PATCH', body: comoJson({ hasta }) }),
}
