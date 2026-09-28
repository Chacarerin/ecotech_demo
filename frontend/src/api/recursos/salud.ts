import { pedir } from '../cliente'

export interface EstadoSalud {
  estado: 'ok' | 'degradado'
  base: 'ok' | 'error'
}

export const consultarSalud = () => pedir<EstadoSalud>('/api/health/')
