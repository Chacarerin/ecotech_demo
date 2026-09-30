import { Moon, Sun } from 'lucide-react'

import { useTema } from '../lib/tema'

/** Alterna entre tema claro y oscuro. El icono muestra el tema al que se cambia. */
export default function BotonTema({ className = '' }: { className?: string }) {
  const { tema, alternar } = useTema()
  const oscuro = tema === 'oscuro'
  return (
    <button
      type="button"
      onClick={alternar}
      aria-label={oscuro ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
      title={oscuro ? 'Tema claro' : 'Tema oscuro'}
      className={`group flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-borde bg-tarjeta text-texto-secundario transition hover:border-acento/50 hover:text-acento active:scale-95 ${className}`}
    >
      {oscuro ? (
        <Sun size={20} strokeWidth={1.75} className="transition-transform duration-500 group-hover:rotate-90" aria-hidden />
      ) : (
        <Moon size={20} strokeWidth={1.75} className="transition-transform duration-500 group-hover:-rotate-12" aria-hidden />
      )}
    </button>
  )
}
