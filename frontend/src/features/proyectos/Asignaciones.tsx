import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CircleAlert, History, UserPlus, Users } from 'lucide-react'
import { useState } from 'react'

import { ErrorApi } from '../../api/cliente'
import { asignaciones, type Proyecto } from '../../api/recursos/proyectos'
import { empleados } from '../../api/recursos/organizacion'
import { useSesion } from '../../auth/contexto'
import Cargando from '../../components/Cargando'
import { EstadoError } from '../../components/Estados'
import { estiloCampo } from '../../components/Formulario'
import { fecha, hoyIso } from '../../lib/formato'

/**
 * Quién trabaja en el proyecto. Administración asigna a cualquiera; el gerente, solo a su
 * gente: la lista de empleados que recibe de la API ya viene acotada a su departamento.
 */
export default function Asignaciones({ proyecto }: { proyecto: Proyecto }) {
  const { usuario } = useSesion()
  const gestiona = usuario?.rol === 'administrador' || usuario?.rol === 'gerente'
  const cache = useQueryClient()
  const [elegido, setElegido] = useState('')
  const [error, setError] = useState<string | null>(null)

  const lista = useQuery({ queryKey: ['asignaciones', proyecto.id], queryFn: () => asignaciones.delProyecto(proyecto.id) })
  const personas = useQuery({ queryKey: ['empleados', {}], queryFn: () => empleados.listar(), enabled: gestiona })

  const refrescar = () => {
    void cache.invalidateQueries({ queryKey: ['asignaciones', proyecto.id] })
    void cache.invalidateQueries({ queryKey: ['proyectos'] })
  }
  const alFallar = (e: unknown) =>
    setError(e instanceof ErrorApi ? Object.values(e.campos ?? {}).flat().join(' ') || e.message : 'No se pudo guardar.')
  const asignar = useMutation({
    mutationFn: () => asignaciones.crear(Number(elegido), proyecto.id),
    onSuccess: () => { setElegido(''); refrescar() },
    onError: alFallar,
  })
  const cerrar = useMutation({ mutationFn: (id: number) => asignaciones.cerrar(id, hoyIso()), onSuccess: refrescar, onError: alFallar })

  if (lista.isPending) return <Cargando />
  if (lista.error) return <EstadoError error={lista.error} />
  const vigentes = lista.data.filter((a) => a.vigente)
  const cerradas = lista.data.filter((a) => !a.vigente)
  const yaAsignados = new Set(vigentes.map((a) => a.empleado))

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-borde bg-tarjeta p-5">
      <h2 className="flex items-center gap-2 text-lg font-bold">
        <Users size={20} strokeWidth={1.75} className="text-acento" aria-hidden />
        Personas asignadas
      </h2>

      {vigentes.length === 0 && <p className="text-texto-tenue">Nadie está asignado a este proyecto.</p>}
      <ul className="flex flex-col divide-y divide-borde">
        {vigentes.map((a) => (
          <li key={a.id} className="flex items-center justify-between gap-3 py-2">
            <span>
              <span className="font-medium">{a.empleadoNombre}</span>
              <span className="block text-sm text-texto-tenue">
                desde {fecha(a.desde)}
                {a.hasta && ` hasta ${fecha(a.hasta)}`}
              </span>
            </span>
            {gestiona && !a.hasta && (
              <button
                onClick={() => { setError(null); cerrar.mutate(a.id) }}
                className="min-h-12 shrink-0 rounded-lg border border-borde px-3 text-sm hover:border-peligro hover:text-peligro"
              >
                Terminar hoy
              </button>
            )}
          </li>
        ))}
      </ul>

      {gestiona && proyecto.activo && (
        <form
          onSubmit={(e) => { e.preventDefault(); setError(null); if (elegido) asignar.mutate() }}
          className="flex flex-col gap-2 sm:flex-row"
        >
          <label className="flex-1">
            <span className="sr-only">Empleado a asignar</span>
            <select value={elegido} onChange={(e) => setElegido(e.target.value)} className={estiloCampo}>
              <option value="">Elegir a quién asignar…</option>
              {personas.data?.filter((p) => !yaAsignados.has(p.id)).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                </option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            disabled={!elegido || asignar.isPending}
            className="flex min-h-12 items-center justify-center gap-2 rounded-lg bg-acento px-4 font-semibold text-white hover:bg-acento-hover disabled:opacity-60"
          >
            <UserPlus size={20} strokeWidth={1.75} aria-hidden />
            Asignar
          </button>
        </form>
      )}
      {!proyecto.activo && <p className="text-sm text-texto-tenue">Un proyecto desactivado no admite asignaciones nuevas.</p>}

      {error && (
        <p className="flex items-center gap-2 rounded-lg bg-peligro/10 p-3 text-sm text-peligro" role="alert">
          <CircleAlert size={20} strokeWidth={1.75} aria-hidden />
          {error}
        </p>
      )}

      {cerradas.length > 0 && (
        <details className="text-sm">
          <summary className="flex min-h-12 cursor-pointer items-center gap-2 text-texto-secundario">
            <History size={16} strokeWidth={1.75} aria-hidden />
            Historial · {cerradas.length} {cerradas.length === 1 ? 'asignación terminada' : 'asignaciones terminadas'}
          </summary>
          <ul className="flex flex-col gap-1 pl-6 text-texto-secundario">
            {cerradas.map((a) => (
              <li key={a.id}>
                {a.empleadoNombre} · {fecha(a.desde)} al {fecha(a.hasta!)}
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  )
}
