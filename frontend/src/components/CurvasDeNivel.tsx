import { useMemo } from 'react'

/**
 * Curvas de nivel, como las de una carta topográfica: el sello visual de la aplicación, que
 * trabaja con proyectos en terreno. Líneas del color del texto a baja opacidad, detrás del
 * contenido; no transmiten información, por eso van ocultas a los lectores de pantalla.
 */
export default function CurvasDeNivel({ lineas = 14, className = '' }: { lineas?: number; className?: string }) {
  const trazos = useMemo(
    () =>
      Array.from({ length: lineas }, (_, i) => {
        const base = 12 + i * 14
        const puntos = Array.from({ length: 25 }, (_, j) => {
          const x = j * 25
          const y = base + Math.sin(j * 0.45 + i * 0.7) * (8 + i * 0.6) + Math.sin(j * 0.13 + i) * 10
          return `${j === 0 ? 'M' : 'L'}${x} ${y.toFixed(1)}`
        })
        return puntos.join(' ')
      }),
    [lineas],
  )
  return (
    <svg
      viewBox={`0 0 600 ${lineas * 14 + 30}`}
      preserveAspectRatio="xMidYMid slice"
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
      aria-hidden
    >
      {trazos.map((d, i) => (
        <path key={i} d={d} fill="none" stroke="currentColor" strokeWidth={i % 4 === 0 ? 1.2 : 0.7} />
      ))}
    </svg>
  )
}
