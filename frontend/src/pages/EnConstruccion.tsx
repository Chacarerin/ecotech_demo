import { Construction } from 'lucide-react'

import type { Modulo } from '../components/navegacion'

export default function EnConstruccion({ modulo }: { modulo: Modulo }) {
  return (
    <section className="flex flex-col items-center gap-2 py-16 text-center">
      <modulo.icono size={32} strokeWidth={1.75} className="text-acento" aria-hidden />
      <h1 className="text-2xl font-bold">{modulo.nombre}</h1>
      <p className="flex items-center gap-2 text-texto-secundario">
        <Construction size={20} strokeWidth={1.75} aria-hidden />
        Este módulo se incorpora en el hito {modulo.hito} del proyecto.
      </p>
    </section>
  )
}
