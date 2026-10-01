import { useQuery } from '@tanstack/react-query'
import { CalendarRange, Clock, FolderKanban, Users } from 'lucide-react'
import { useState } from 'react'

import { proyectos } from '../../api/recursos/proyectos'
import { registros, type Registro } from '../../api/recursos/registros'
import { useSesion } from '../../auth/contexto'
import Cargando from '../../components/Cargando'
import { EstadoError, EstadoVacio } from '../../components/Estados'
import { estiloCampo } from '../../components/Formulario'
import { fecha as fechaTexto, haceDias, horas as horasTexto, hoyIso } from '../../lib/formato'

const PERIODOS = [
  { nombre: 'Últimos 7 días', dias: 6 },
  { nombre: 'Últimos 30 días', dias: 29 },
]

/**
 * Lo que ven gerencia y administración: las horas registradas, sin poder modificarlas.
 * El alcance lo pone la API: el gerente solo recibe las de su departamento.
 */
export default function RevisionHoras() {
  const { usuario } = useSesion()
  const esGerente = usuario?.rol === 'gerente'
  const [desde, setDesde] = useState(haceDias(6))
  const [hasta, setHasta] = useState(hoyIso())
  const [proyecto, setProyecto] = useState('')

  const lista = useQuery({
    queryKey: ['registros', { desde, hasta, proyecto }],
    queryFn: () => registros.listar({ desde, hasta, proyecto: proyecto ? Number(proyecto) : undefined }),
  })
  const opciones = useQuery({ queryKey: ['proyectos', 'filtro'], queryFn: () => proyectos.listar() })

  const total = lista.data?.reduce((s, r) => s + Number(r.horas), 0) ?? 0
  const porPersona = sumarPor(lista.data ?? [], (r) => r.empleadoNombre)
  const porProyecto = sumarPor(lista.data ?? [], (r) => r.proyectoNombre)

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="flex items-center gap-2 text-3xl font-bold">
          <Clock size={28} strokeWidth={1.75} className="text-acento" aria-hidden />
          {esGerente ? 'Horas de mi departamento' : 'Horas registradas'}
        </h1>
        <p className="text-texto-secundario">
          Las horas las registra cada empleado; aquí se revisan{esGerente ? ', solo las de su gente' : ''}.
        </p>
      </div>

      {/* ── Filtros ── */}
      <div className="flex flex-col gap-3 rounded-2xl border border-borde bg-tarjeta p-4 shadow-suave">
        <div className="flex flex-wrap gap-2">
          {PERIODOS.map((p) => {
            const activo = desde === haceDias(p.dias) && hasta === hoyIso()
            return (
              <button
                key={p.nombre}
                onClick={() => {
                  setDesde(haceDias(p.dias))
                  setHasta(hoyIso())
                }}
                className={`flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold transition active:scale-95 ${
                  activo ? 'bg-acento text-sobre-acento' : 'border border-borde text-texto-secundario hover:border-acento/40 hover:text-acento'
                }`}
              >
                <CalendarRange size={16} strokeWidth={1.75} aria-hidden />
                {p.nombre}
              </button>
            )
          })}
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="flex flex-col gap-1 text-sm font-semibold">
            Desde
            <input type="date" value={desde} max={hasta} onChange={(e) => setDesde(e.target.value)} className={estiloCampo} />
          </label>
          <label className="flex flex-col gap-1 text-sm font-semibold">
            Hasta
            <input type="date" value={hasta} min={desde} max={hoyIso()} onChange={(e) => setHasta(e.target.value)} className={estiloCampo} />
          </label>
          <label className="flex flex-col gap-1 text-sm font-semibold">
            Proyecto
            <select value={proyecto} onChange={(e) => setProyecto(e.target.value)} className={estiloCampo}>
              <option value="">Todos</option>
              {opciones.data?.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {lista.isPending && <Cargando />}
      {lista.error && <EstadoError error={lista.error} />}
      {lista.data && lista.data.length === 0 && <EstadoVacio texto="No hay horas registradas en ese período." />}

      {lista.data && lista.data.length > 0 && (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            <Totales titulo="Por persona" icono={Users} filas={porPersona} total={total} />
            <Totales titulo="Por proyecto" icono={FolderKanban} filas={porProyecto} total={total} />
          </div>

          <div className="flex flex-col gap-3">
            <h2 className="text-lg font-bold">
              Detalle · {lista.data.length} {lista.data.length === 1 ? 'registro' : 'registros'}
            </h2>
            <div className="overflow-hidden rounded-2xl border border-borde bg-tarjeta shadow-suave">
              <table className="w-full text-sm">
                <thead className="bg-superficie text-left text-xs tracking-wide text-texto-secundario uppercase">
                  <tr>
                    <th className="px-4 py-2.5 font-semibold">Fecha</th>
                    <th className="px-4 py-2.5 font-semibold">Persona</th>
                    <th className="hidden px-4 py-2.5 font-semibold sm:table-cell">Proyecto</th>
                    <th className="hidden px-4 py-2.5 font-semibold md:table-cell">Qué se hizo</th>
                    <th className="px-4 py-2.5 text-right font-semibold">Horas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-borde">
                  {lista.data.map((r) => (
                    <tr key={r.id} className="transition-colors hover:bg-superficie/60">
                      <td className="px-4 py-2.5 font-mono whitespace-nowrap text-texto-secundario">{fechaTexto(r.fecha)}</td>
                      <td className="px-4 py-2.5">
                        <span className="font-medium">{r.empleadoNombre}</span>
                        <span className="block text-xs text-texto-tenue sm:hidden">{r.proyectoNombre}</span>
                      </td>
                      <td className="hidden px-4 py-2.5 sm:table-cell">{r.proyectoNombre}</td>
                      <td className="hidden max-w-xs truncate px-4 py-2.5 text-texto-secundario md:table-cell">{r.descripcion || '—'}</td>
                      <td className="px-4 py-2.5 text-right font-mono font-semibold whitespace-nowrap">{horasTexto(r.horas)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </section>
  )
}

function sumarPor(lista: Registro[], clave: (r: Registro) => string): [string, number][] {
  const mapa = new Map<string, number>()
  for (const r of lista) mapa.set(clave(r), (mapa.get(clave(r)) ?? 0) + Number(r.horas))
  return [...mapa.entries()].sort((a, b) => b[1] - a[1])
}

function Totales({ titulo, icono: Icono, filas, total }: {
  titulo: string
  icono: typeof Users
  filas: [string, number][]
  total: number
}) {
  const mayor = filas[0]?.[1] ?? 1
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-borde bg-tarjeta p-5 shadow-suave">
      <div className="flex items-baseline justify-between">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <Icono size={20} strokeWidth={1.75} className="text-acento" aria-hidden />
          {titulo}
        </h2>
        <span className="font-display text-2xl font-bold text-acento">{horasTexto(total)}</span>
      </div>
      <ul className="flex flex-col gap-2.5">
        {filas.map(([nombre, h]) => (
          <li key={nombre} className="flex flex-col gap-1 text-sm">
            <span className="flex justify-between gap-3">
              <span className="truncate">{nombre}</span>
              <span className="font-mono text-texto-secundario">{horasTexto(h)}</span>
            </span>
            <span className="h-1.5 overflow-hidden rounded-full bg-superficie">
              {/* El ancho depende de un dato: es el único estilo en línea admitido (CLAUDE.md §7) */}
              <span className="block h-full rounded-full bg-acento/80" style={{ width: `${(h / mayor) * 100}%` }} />
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
