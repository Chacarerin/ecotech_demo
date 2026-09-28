import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'

import { alExpirar } from '../api/cliente'
import { cerrarSesion, iniciarSesion, recuperarSesion, usuarioActual, type Usuario } from '../api/recursos/auth'
import { ContextoSesion, type Sesion } from './contexto'

/**
 * Sesión en memoria · docs/authentication.md §3.
 *
 * El token de acceso nunca se escribe en localStorage. Al recargar la página se
 * pierde, y se recupera con la cookie de renovación, que el navegador guarda y que
 * el JavaScript de la página no puede leer.
 */
export default function SesionProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    alExpirar(() => setUsuario(null))
    recuperarSesion()
      .then(async (hay) => setUsuario(hay ? await usuarioActual() : null))
      .catch(() => setUsuario(null))
      .finally(() => setCargando(false))
  }, [])

  const entrar = useCallback(async (nombre: string, clave: string) => {
    await iniciarSesion(nombre, clave)
    setUsuario(await usuarioActual())
  }, [])

  const salir = useCallback(async () => {
    await cerrarSesion()
    setUsuario(null)
  }, [])

  const valor = useMemo<Sesion>(() => ({ usuario, cargando, entrar, salir }), [usuario, cargando, entrar, salir])
  return <ContextoSesion.Provider value={valor}>{children}</ContextoSesion.Provider>
}
