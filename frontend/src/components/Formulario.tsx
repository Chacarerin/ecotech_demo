import { LoaderCircle } from 'lucide-react'
import type { ReactNode } from 'react'

export const estiloCampo =
  'w-full rounded-lg border border-borde bg-tarjeta px-3 py-3 outline-none focus:border-acento focus:ring-2 focus:ring-acento/20 disabled:opacity-60'

/** Campo con su etiqueta siempre visible y su error debajo · CLAUDE.md §10 (formularios móviles). */
export function Campo({ etiqueta, error, children }: { etiqueta: string; error?: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-sm font-semibold">{etiqueta}</span>
      {children}
      {error && <span className="text-sm text-peligro">{error}</span>}
    </label>
  )
}

export function BotonPrimario({ cargando, children }: { cargando: boolean; children: ReactNode }) {
  return (
    <button
      type="submit"
      disabled={cargando}
      className="flex min-h-12 items-center justify-center gap-2 rounded-lg bg-acento px-5 font-semibold text-white hover:bg-acento-hover disabled:opacity-60"
    >
      {cargando && <LoaderCircle size={20} strokeWidth={1.75} className="animate-spin" aria-hidden />}
      {children}
    </button>
  )
}
