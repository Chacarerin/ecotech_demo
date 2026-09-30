import { Leaf, LogOut } from 'lucide-react'
import { NavLink, Outlet } from 'react-router'

import { useSesion } from '../auth/contexto'
import { MODULOS } from './navegacion'

/**
 * Estructura común: barra superior en escritorio y navegación inferior en el
 * celular, al alcance del pulgar (CLAUDE.md §7). Cada rol ve solo sus módulos.
 */
export default function Layout() {
  const { usuario, salir } = useSesion()
  const visibles = MODULOS.filter((m) => usuario && m.roles.includes(usuario.rol))
  const enlace = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${
      isActive ? 'bg-acento/10 text-acento' : 'text-texto-secundario hover:text-texto'
    }`

  return (
    <div className="min-h-svh pb-20 lg:pb-0">
      <header className="border-b border-borde bg-tarjeta">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <span className="flex items-center gap-2 font-bold">
            <Leaf size={20} strokeWidth={1.75} className="text-acento" aria-hidden />
            EcoTech
          </span>
          <nav className="hidden gap-1 lg:flex" aria-label="Módulos">
            {visibles.map((m) => (
              <NavLink key={m.ruta} to={m.ruta} end={m.ruta === '/'} className={enlace}>
                <m.icono size={20} strokeWidth={1.75} aria-hidden />
                {m.nombre}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <span className="hidden flex-col items-end text-right leading-tight whitespace-nowrap sm:flex">
              <span className="text-sm font-semibold">{usuario?.nombre}</span>
              <span className="text-xs text-texto-tenue capitalize">{usuario?.rol}</span>
            </span>
            <button
              onClick={() => void salir()}
              aria-label="Cerrar sesión"
              className="flex min-h-12 min-w-12 items-center justify-center rounded-lg text-texto-secundario hover:bg-fondo hover:text-texto"
            >
              <LogOut size={20} strokeWidth={1.75} aria-hidden />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">
        <Outlet />
      </main>

      <nav
        className="fixed inset-x-0 bottom-0 flex justify-around border-t border-borde bg-tarjeta lg:hidden"
        aria-label="Módulos"
      >
        {visibles.map((m) => (
          <NavLink
            key={m.ruta}
            to={m.ruta}
            end={m.ruta === '/'}
            aria-label={m.nombre}
            className={({ isActive }) =>
              `flex min-h-14 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-0.5 text-[10px] min-[360px]:text-[11px] ${
                isActive ? 'text-acento' : 'text-texto-tenue'
              }`
            }
          >
            <m.icono size={24} strokeWidth={1.75} aria-hidden />
            <span className="w-full truncate text-center">{m.nombreCorto ?? m.nombre}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
