/**
 * Marca de EcoTech: un sol que asoma sobre dos cerros, en el color de acento. Hereda el color
 * del texto, así que se adapta sola al tema.
 */
export function Isotipo({ size = 28, sobrePortada = false }: { size?: number; sobrePortada?: boolean }) {
  const cerros = sobrePortada ? 'fill-sobre-portada' : 'fill-sobre-acento'
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden>
      {/* Sobre una portada, el recuadro se aclara: del mismo verde, desaparecería */}
      <rect width="32" height="32" rx="9" className={sobrePortada ? 'fill-sobre-portada/15' : 'fill-acento'} />
      <circle cx="20.5" cy="12" r="4.5" className="fill-sol" />
      <path d="M4 25c3.5-5.5 7-8 10.5-8S21 20 28 25v3H4z" className={cerros} opacity=".92" />
      <path d="M4 28c4-3.4 8-5 12-5s8 1.6 12 5z" className={cerros} opacity=".55" />
    </svg>
  )
}

export default function Marca({ compacta = false, sobrePortada = false }: { compacta?: boolean; sobrePortada?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <Isotipo sobrePortada={sobrePortada} />
      {!compacta && (
        <span className="flex flex-col leading-none">
          <span className="font-display text-lg font-bold tracking-tight">EcoTech</span>
          <span className={`text-[11px] tracking-wide ${sobrePortada ? 'opacity-70' : 'text-texto-tenue'}`}>Solutions</span>
        </span>
      )}
    </span>
  )
}
