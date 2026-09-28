import { createContext, useContext } from 'react'

import type { Usuario } from '../api/recursos/auth'

export interface Sesion {
  usuario: Usuario | null
  cargando: boolean
  entrar: (usuario: string, clave: string) => Promise<void>
  salir: () => Promise<void>
}

export const ContextoSesion = createContext<Sesion | null>(null)

export function useSesion(): Sesion {
  const sesion = useContext(ContextoSesion)
  if (!sesion) throw new Error('useSesion debe usarse dentro de SesionProvider')
  return sesion
}
