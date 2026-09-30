import { ArrowLeft, CircleDashed, GitBranch } from 'lucide-react'
import { Link } from 'react-router'

import CurvasDeNivel from '../components/CurvasDeNivel'
import type { Modulo } from '../components/navegacion'
import { HITOS, REPOSITORIO } from '../lib/hojaDeRuta'

/** Un módulo que todavía no está: dice qué hará, en qué hito llega y cómo va el proyecto. */
export default function EnConstruccion({ modulo }: { modulo: Modulo }) {
  const hito = HITOS.find((h) => h.numero === modulo.hito)
  const enCurso = hito?.estado === 'proximo'
  return (
    <section className="relative overflow-hidden rounded-3xl border border-dashed border-sol/40 bg-tarjeta px-6 py-14 text-center shadow-suave">
      <CurvasDeNivel className="text-sol opacity-[0.12]" />
      <div className="relative mx-auto flex max-w-md flex-col items-center gap-4">
        <span className="flex size-16 items-center justify-center rounded-2xl bg-sol/12 text-sol">
          <modulo.icono size={32} strokeWidth={1.5} aria-hidden />
        </span>
        <span className="flex items-center gap-1.5 rounded-full bg-sol/12 px-3 py-1 text-xs font-semibold text-sol">
          <CircleDashed size={14} strokeWidth={2} aria-hidden />
          Hito {modulo.hito} · {enCurso ? 'en construcción' : 'planificado'}
        </span>
        <h1 className="text-3xl font-bold">{modulo.nombre}</h1>
        <p className="text-texto-secundario">{modulo.descripcion}.</p>
        <p className="text-sm text-texto-tenue">
          {enCurso
            ? 'Es el próximo módulo en llegar. Cuando esté listo, aparecerá aquí sin necesidad de reinstalar nada.'
            : 'Llega después de los hitos en curso. La hoja de ruta del panel muestra el orden.'}
        </p>
        <div className="mt-2 flex flex-wrap justify-center gap-2">
          <Link
            to="/"
            className="flex min-h-11 items-center gap-2 rounded-xl border border-borde bg-tarjeta px-4 text-sm font-semibold transition hover:border-acento/40 hover:text-acento active:scale-95"
          >
            <ArrowLeft size={18} strokeWidth={1.75} aria-hidden />
            Volver al panel
          </Link>
          <a
            href={`${REPOSITORIO}/blob/main/docs/project_status.md`}
            target="_blank"
            rel="noreferrer"
            className="flex min-h-11 items-center gap-2 rounded-xl px-4 text-sm font-semibold text-acento transition hover:bg-acento/10 active:scale-95"
          >
            <GitBranch size={18} strokeWidth={1.75} aria-hidden />
            Ver el plan del hito
          </a>
        </div>
      </div>
    </section>
  )
}
