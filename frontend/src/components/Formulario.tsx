import { LoaderCircle } from 'lucide-react'
import type { ReactNode } from 'react'

export const estiloCampo =
  'w-full rounded-xl border border-borde bg-tarjeta px-3.5 py-3 outline-none transition placeholder:text-texto-tenue/60 hover:border-texto-tenue/50 focus:border-acento focus:ring-4 focus:ring-acento/15 disabled:opacity-60'

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
      className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-acento px-5 font-semibold text-sobre-acento shadow-suave transition hover:bg-acento-hover hover:shadow-elevada active:scale-[0.98] disabled:opacity-60"
    >
      {cargando && <LoaderCircle size={20} strokeWidth={1.75} className="animate-spin" aria-hidden />}
      {children}
    </button>
  )
}
