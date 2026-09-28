import { ShieldX } from 'lucide-react'
import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router'

import type { Rol } from '../api/recursos/auth'
import Cargando from '../components/Cargando'
import { useSesion } from './contexto'

/**
 * Exige sesión y, si se indica, uno de los roles admitidos.
 *
 * Es comodidad, no seguridad: evita mostrar pantallas que la API rechazaría.
 * El permiso real lo decide cada endpoint.
 */
export default function RutaProtegida({ roles, children }: { roles?: Rol[]; children: ReactNode }) {
  const { usuario, cargando } = useSesion()
  const ubicacion = useLocation()

  if (cargando) return <Cargando texto="Verificando la sesión…" />
  if (!usuario) return <Navigate to="/ingresar" replace state={{ desde: ubicacion.pathname }} />
  if (roles && !roles.includes(usuario.rol)) {
    return (
      <div className="flex flex-col items-center gap-2 py-16 text-center">
        <ShieldX size={32} strokeWidth={1.75} className="text-peligro" aria-hidden />
        <h1 className="text-lg font-bold">Sin acceso a este módulo</h1>
        <p className="text-texto-secundario">Su rol no tiene permiso para ver esta sección.</p>
      </div>
    )
  }
  return <>{children}</>
}
