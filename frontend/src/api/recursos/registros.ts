import { comoJson, pedir } from '../cliente'

export interface Registro {
  id: number
  empleado: number
  empleadoNombre: string
  proyecto: number
  proyectoNombre: string
  fecha: string                 // aaaa-mm-dd
  horas: string                 // DRF entrega los decimales como texto: «7.5»
  descripcion: string
  autor: number | null
}

export type DatosRegistro = Pick<Registro, 'proyecto' | 'fecha' | 'horas' | 'descripcion'>

export interface FiltrosRegistro {
  desde?: string
  hasta?: string
  proyecto?: number
  empleado?: number
}

export const registros = {
  listar: (filtros: FiltrosRegistro = {}) => {
    const p = new URLSearchParams()
    for (const [clave, valor] of Object.entries(filtros)) if (valor !== undefined && valor !== '') p.set(clave, String(valor))
    return pedir<Registro[]>(`/api/registros/${p.size ? `?${p}` : ''}`)
  },
  guardar: (datos: DatosRegistro, id?: number) =>
    pedir<Registro>(id ? `/api/registros/${id}/` : '/api/registros/', {
      method: id ? 'PATCH' : 'POST',
      body: comoJson(datos),
    }),
  eliminar: (id: number) => pedir<void>(`/api/registros/${id}/`, { method: 'DELETE' }),
}

/** Plazo en que el empleado puede registrar o corregir, igual que la API. */
export const VENTANA_DIAS = 7
