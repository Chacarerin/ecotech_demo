import { LogOut } from 'lucide-react'
import { NavLink, Outlet } from 'react-router'

import { useSesion } from '../auth/contexto'
import { iniciales, NOMBRE_ROL } from '../lib/persona'
import BotonTema from './BotonTema'
import Marca from './Marca'
import { MODULOS, type Modulo } from './navegacion'

/** Marca de un módulo que todavía no está: dice en qué hito llega. */
function MarcaHito({ modulo, activo }: { modulo: Modulo; activo: boolean }) {
  if (!modulo.hito) return null
  return (
    <span
      className={`ml-auto rounded-md px-1.5 py-0.5 font-mono text-[10px] font-semibold ${
        activo ? 'bg-sobre-acento/15 text-sobre-acento' : 'bg-sol/12 text-sol'
      }`}
    >
      H{modulo.hito}
    </span>
  )
}

/**
 * Estructura común. En escritorio, barra lateral con los módulos y la cuenta; en el celular,
 * barra superior y navegación inferior al alcance del pulgar (CLAUDE.md §7). Cada rol ve solo
 * sus módulos.
 */
export default function Layout() {
  const { usuario, salir } = useSesion()
  const visibles = MODULOS.filter((m) => usuario && m.roles.includes(usuario.rol))

  const botonSalir = (
    <button
      onClick={() => void salir()}
      aria-label="Cerrar sesión"
      title="Cerrar sesión"
      className="flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-borde bg-tarjeta text-texto-secundario transition hover:border-peligro/40 hover:text-peligro active:scale-95"
    >
      <LogOut size={20} strokeWidth={1.75} aria-hidden />
    </button>
  )

  return (
    <div className="min-h-svh lg:grid lg:grid-cols-[16rem_1fr]">
      {/* ── Barra lateral · escritorio ── */}
      <aside className="sticky top-0 hidden h-svh flex-col gap-6 border-r border-borde bg-tarjeta/60 p-4 backdrop-blur lg:flex">
        <div className="px-2 pt-1">
          <Marca />
        </div>

        <nav className="flex flex-col gap-1" aria-label="Módulos">
          <span className="px-3 pb-1 text-[11px] font-semibold tracking-wider text-texto-tenue uppercase">Módulos</span>
          {visibles.map((m) => (
            <NavLink
              key={m.ruta}
              to={m.ruta}
              end={m.ruta === '/'}
              className={({ isActive }) =>
                `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? 'bg-acento text-sobre-acento shadow-suave'
                    : 'text-texto-secundario hover:translate-x-0.5 hover:bg-superficie hover:text-texto'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <m.icono
                    size={20}
                    strokeWidth={1.75}
                    className="transition-transform duration-200 group-hover:scale-110"
                    aria-hidden
                  />
                  {m.nombre}
                  <MarcaHito modulo={m} activo={isActive} />
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto flex flex-col gap-3 rounded-2xl border border-borde bg-tarjeta p-3 shadow-suave">
          <div className="flex items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-acento/12 font-display font-bold text-acento">
              {iniciales(usuario?.nombre)}
            </span>
            <span className="flex min-w-0 flex-col leading-tight">
              <span className="truncate text-sm font-semibold">{usuario?.nombre}</span>
              <span className="text-xs text-texto-tenue">{usuario && NOMBRE_ROL[usuario.rol]}</span>
            </span>
          </div>
          <div className="flex gap-2">
            <BotonTema className="flex-1" />
            {botonSalir}
          </div>
        </div>
      </aside>

      <div className="flex min-h-svh min-w-0 flex-col pb-20 lg:pb-0">
        {/* ── Barra superior · celular ── */}
        <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-borde bg-fondo/85 px-4 py-2.5 backdrop-blur lg:hidden">
          <Marca />
          <div className="flex items-center gap-2">
            <BotonTema />
            {botonSalir}
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 lg:px-10 lg:py-10">
          <Outlet />
        </main>
      </div>

      {/* ── Navegación inferior · celular ── */}
      <nav
        className="fixed inset-x-0 bottom-0 z-10 flex justify-around border-t border-borde bg-tarjeta/95 backdrop-blur lg:hidden"
        aria-label="Módulos"
      >
        {visibles.map((m) => (
          <NavLink
            key={m.ruta}
            to={m.ruta}
            end={m.ruta === '/'}
            aria-label={m.nombre}
            className={({ isActive }) =>
              `relative flex min-h-14 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-0.5 text-[10px] transition min-[360px]:text-[11px] ${
                isActive ? 'font-semibold text-acento' : 'text-texto-tenue active:text-texto'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && <span className="absolute top-0 h-0.5 w-8 rounded-full bg-acento" aria-hidden />}
                <m.icono size={24} strokeWidth={1.75} aria-hidden />
                <span className="w-full truncate text-center">{m.nombreCorto ?? m.nombre}</span>
                {m.hito && <span className="absolute top-2 left-[calc(50%+10px)] size-1.5 rounded-full bg-sol" aria-hidden />}
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
