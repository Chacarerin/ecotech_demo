import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CircleAlert, Clock, Pencil, Trash2, X } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { proyectos } from '../../api/recursos/proyectos'
import { registros, VENTANA_DIAS, type Registro } from '../../api/recursos/registros'
import Cargando from '../../components/Cargando'
import { EstadoError, EstadoVacio } from '../../components/Estados'
import { aplicarErroresApi } from '../../components/errorApi'
import { BotonPrimario, Campo, estiloCampo } from '../../components/Formulario'
import { diaSemana, fecha as fechaTexto, haceDias, horas as horasTexto, hoyIso } from '../../lib/formato'

const TOPE = 12

const esquema = z.object({
  proyecto: z.string().min(1, 'Elija un proyecto.'),
  fecha: z.string().min(1, 'Ingrese la fecha.'),
  horas: z
    .string()
    .trim()
    .transform((v) => v.replace(',', '.'))
    .refine((v) => /^\d{1,2}(\.\d)?$/.test(v) && Number(v) >= 0.5 && Number(v) <= TOPE,
      'Ingrese entre 0,5 y 12 horas.')
    .refine((v) => (Number(v) * 2) % 1 === 0, 'Las horas se registran en pasos de media hora: 7, 7,5 u 8.'),
  descripcion: z.string().trim().max(500, 'Máximo 500 caracteres.'),
})
type Entrada = z.input<typeof esquema>
type Datos = z.output<typeof esquema>

const vacio = (): Entrada => ({ proyecto: '', fecha: hoyIso(), horas: '', descripcion: '' })
const editable = (r: Registro) => r.fecha >= haceDias(VENTANA_DIAS)

/** Pantalla del empleado: registra sus horas y corrige las de la última semana. */
export default function RegistroHoras() {
  const cache = useQueryClient()
  const [editando, setEditando] = useState<Registro | null>(null)
  const [aEliminar, setAEliminar] = useState<number | null>(null)
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null)

  const misProyectos = useQuery({ queryKey: ['proyectos', 'mios'], queryFn: () => proyectos.listar() })
  const lista = useQuery({
    queryKey: ['registros', 'mios'],
    queryFn: () => registros.listar({ desde: haceDias(30) }),
  })

  const { register, handleSubmit, reset, setError, formState } = useForm<Entrada, unknown, Datos>({
    resolver: zodResolver(esquema),
    defaultValues: vacio(),
  })

  const refrescar = () => void cache.invalidateQueries({ queryKey: ['registros'] })
  const guardar = useMutation({
    mutationFn: (d: Datos) => registros.guardar({ ...d, proyecto: Number(d.proyecto) }, editando?.id),
    onSuccess: () => {
      setEditando(null)
      reset(vacio())
      refrescar()
    },
    onError: (e) => setErrorGeneral(aplicarErroresApi(e, setError)),
  })
  const eliminar = useMutation({
    mutationFn: (id: number) => registros.eliminar(id),
    onSuccess: () => {
      setAEliminar(null)
      refrescar()
    },
  })

  const editar = (r: Registro) => {
    setErrorGeneral(null)
    setEditando(r)
    reset({ proyecto: String(r.proyecto), fecha: r.fecha, horas: r.horas.replace('.', ','), descripcion: r.descripcion })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  const cancelar = () => {
    setEditando(null)
    reset(vacio())
  }

  if (lista.isPending || misProyectos.isPending) return <Cargando />
  if (lista.error) return <EstadoError error={lista.error} />
  if (misProyectos.error) return <EstadoError error={misProyectos.error} />

  const porDia = agrupar(lista.data)
  const err = formState.errors

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="flex items-center gap-2 text-3xl font-bold">
          <Clock size={28} strokeWidth={1.75} className="text-acento" aria-hidden />
          Mis horas
        </h1>
        <p className="text-texto-secundario">
          Se registran y se corrigen las horas de los últimos {VENTANA_DIAS} días, hasta {TOPE} por día.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <form
          noValidate
          onSubmit={handleSubmit((d) => {
            setErrorGeneral(null)
            guardar.mutate(d)
          })}
          className="flex flex-col gap-4 rounded-2xl border border-borde bg-tarjeta p-5 shadow-suave"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">{editando ? 'Corregir un registro' : 'Registrar horas'}</h2>
            {editando && (
              <button
                type="button"
                onClick={cancelar}
                className="flex min-h-11 items-center gap-1 rounded-xl px-3 text-sm text-texto-secundario transition hover:bg-superficie hover:text-texto"
              >
                <X size={16} strokeWidth={1.75} aria-hidden />
                Cancelar
              </button>
            )}
          </div>
          <Campo etiqueta="Proyecto" error={err.proyecto?.message}>
            <select {...register('proyecto')} className={estiloCampo}>
              <option value="">Elegir el proyecto…</option>
              {misProyectos.data.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                  {!p.activo && ' (desactivado)'}
                </option>
              ))}
            </select>
          </Campo>
          <div className="grid grid-cols-2 gap-4">
            <Campo etiqueta="Fecha" error={err.fecha?.message}>
              <input {...register('fecha')} type="date" min={haceDias(VENTANA_DIAS)} max={hoyIso()} className={estiloCampo} />
            </Campo>
            <Campo etiqueta="Horas" error={err.horas?.message}>
              <input {...register('horas')} inputMode="decimal" placeholder="7,5" className={estiloCampo} />
            </Campo>
          </div>
          <Campo etiqueta="Qué se hizo" error={err.descripcion?.message}>
            <textarea {...register('descripcion')} rows={2} placeholder="Montaje de paneles, sector norte" className={estiloCampo} />
          </Campo>
          {errorGeneral && (
            <p className="flex items-center gap-2 rounded-xl bg-peligro/10 p-3 text-sm text-peligro" role="alert">
              <CircleAlert size={20} strokeWidth={1.75} aria-hidden />
              {errorGeneral}
            </p>
          )}
          <BotonPrimario cargando={guardar.isPending}>{editando ? 'Guardar la corrección' : 'Registrar'}</BotonPrimario>
        </form>

        <Semana registros={lista.data} />
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-bold">Últimos 30 días</h2>
        {porDia.length === 0 && <EstadoVacio texto="Todavía no registra horas." />}
        {porDia.map(([dia, items]) => {
          const total = items.reduce((s, r) => s + Number(r.horas), 0)
          return (
            <div key={dia} className="rounded-2xl border border-borde bg-tarjeta shadow-suave">
              <div className="flex items-center justify-between gap-3 border-b border-borde px-4 py-2.5">
                <span className="font-semibold first-letter:uppercase">
                  {diaSemana(dia)} <span className="font-normal text-texto-tenue">· {fechaTexto(dia)}</span>
                </span>
                <span className="font-mono text-sm text-texto-secundario">
                  {horasTexto(total)} de {TOPE}
                </span>
              </div>
              <ul className="divide-y divide-borde">
                {items.map((r) => (
                  <li key={r.id} className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-superficie/60">
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="font-medium">{r.proyectoNombre}</span>
                      {r.descripcion && <span className="truncate text-sm text-texto-tenue">{r.descripcion}</span>}
                    </span>
                    <span className="font-mono font-semibold">{horasTexto(r.horas)}</span>
                    {editable(r) &&
                      (aEliminar === r.id ? (
                        <span className="flex items-center gap-1 text-sm">
                          <button
                            onClick={() => eliminar.mutate(r.id)}
                            className="min-h-11 rounded-xl bg-peligro px-3 font-semibold text-tarjeta transition active:scale-95"
                          >
                            Eliminar
                          </button>
                          <button
                            onClick={() => setAEliminar(null)}
                            className="min-h-11 rounded-xl px-3 text-texto-secundario hover:bg-superficie"
                          >
                            No
                          </button>
                        </span>
                      ) : (
                        <span className="flex">
                          <button
                            onClick={() => editar(r)}
                            aria-label={`Corregir el registro de ${r.proyectoNombre}`}
                            className="flex min-h-11 min-w-11 items-center justify-center rounded-xl text-texto-tenue transition hover:bg-superficie hover:text-acento"
                          >
                            <Pencil size={18} strokeWidth={1.75} aria-hidden />
                          </button>
                          <button
                            onClick={() => setAEliminar(r.id)}
                            aria-label={`Eliminar el registro de ${r.proyectoNombre}`}
                            className="flex min-h-11 min-w-11 items-center justify-center rounded-xl text-texto-tenue transition hover:bg-peligro/10 hover:text-peligro"
                          >
                            <Trash2 size={18} strokeWidth={1.75} aria-hidden />
                          </button>
                        </span>
                      ))}
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </div>
    </section>
  )
}

/** Registros agrupados por fecha, del más reciente al más antiguo. */
function agrupar(lista: Registro[]): [string, Registro[]][] {
  const mapa = new Map<string, Registro[]>()
  for (const r of lista) mapa.set(r.fecha, [...(mapa.get(r.fecha) ?? []), r])
  return [...mapa.entries()].sort(([a], [b]) => b.localeCompare(a))
}

/** Los últimos siete días, con una barra por día contra el tope de 12 horas. */
function Semana({ registros: lista }: { registros: Registro[] }) {
  const dias = Array.from({ length: VENTANA_DIAS }, (_, i) => haceDias(VENTANA_DIAS - 1 - i))
  const total = (d: string) => lista.filter((r) => r.fecha === d).reduce((s, r) => s + Number(r.horas), 0)
  const semana = dias.reduce((s, d) => s + total(d), 0)
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-borde bg-tarjeta p-5 shadow-suave">
      <div className="flex items-baseline justify-between">
        <h2 className="text-lg font-bold">Últimos 7 días</h2>
        <span className="font-display text-3xl font-bold text-acento">{horasTexto(semana)}</span>
      </div>
      <ul className="flex flex-col gap-2">
        {dias.map((d) => {
          const h = total(d)
          return (
            <li key={d} className="grid grid-cols-[6.5rem_1fr_3.5rem] items-center gap-3 text-sm">
              <span className="truncate text-texto-secundario first-letter:uppercase">{diaSemana(d)}</span>
              <span className="h-2 overflow-hidden rounded-full bg-superficie">
                {/* El ancho depende de un dato: es el único estilo en línea admitido (CLAUDE.md §7) */}
                <span className="block h-full rounded-full bg-acento" style={{ width: `${(h / TOPE) * 100}%` }} />
              </span>
              <span className="text-right font-mono text-texto-secundario">{h ? horasTexto(h) : '—'}</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
