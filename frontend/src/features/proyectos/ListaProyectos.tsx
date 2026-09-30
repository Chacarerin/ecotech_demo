import { useQuery } from '@tanstack/react-query'
import { FolderKanban, MapPin, Plus, Search, Users } from 'lucide-react'
import { useDeferredValue, useState } from 'react'
import { Link } from 'react-router'

import { proyectos } from '../../api/recursos/proyectos'
import { useSesion } from '../../auth/contexto'
import Cargando from '../../components/Cargando'
import { EstadoError, EstadoVacio } from '../../components/Estados'
import { estiloCampo } from '../../components/Formulario'

const ESTADOS = { activos: true, inactivos: false, todos: undefined } as const

export default function ListaProyectos() {
  const { usuario } = useSesion()
  const [texto, setTexto] = useState('')
  const [estado, setEstado] = useState<keyof typeof ESTADOS>('activos')
  const q = useDeferredValue(texto.trim())
  const lista = useQuery({
    queryKey: ['proyectos', { q, estado }],
    queryFn: () => proyectos.listar({ q, activo: ESTADOS[estado] }),
  })

  return (
    <section className="flex flex-col gap-4">
      <header className="flex items-center justify-between gap-3">
        <h1 className="flex items-center gap-2 text-3xl font-bold">
          <FolderKanban size={24} strokeWidth={1.75} className="text-acento" aria-hidden />
          Proyectos
        </h1>
        {usuario?.rol === 'administrador' && (
          <Link
            to="/proyectos/nuevo"
            className="flex min-h-12 items-center gap-2 rounded-xl bg-acento px-4 font-semibold text-sobre-acento shadow-suave transition hover:bg-acento-hover hover:shadow-elevada active:scale-[0.98]"
          >
            <Plus size={20} strokeWidth={1.75} aria-hidden />
            <span>Nuevo</span>
          </Link>
        )}
      </header>

      <div className="flex flex-col gap-3 sm:flex-row">
        <label className="relative flex-1">
          <span className="sr-only">Buscar por nombre o ciudad</span>
          <Search size={20} strokeWidth={1.75} className="absolute top-3.5 left-3 text-texto-tenue" aria-hidden />
          <input
            type="search"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Buscar por nombre o ciudad"
            className={`${estiloCampo} pl-10`}
          />
        </label>
        <label className="sm:w-48">
          <span className="sr-only">Estado</span>
          <select value={estado} onChange={(e) => setEstado(e.target.value as keyof typeof ESTADOS)} className={estiloCampo}>
            <option value="activos">Activos</option>
            <option value="inactivos">Desactivados</option>
            <option value="todos">Todos</option>
          </select>
        </label>
      </div>

      {lista.isPending && <Cargando />}
      {lista.error && <EstadoError error={lista.error} />}
      {lista.data?.length === 0 && <EstadoVacio texto="No hay proyectos que coincidan." />}

      {lista.data && lista.data.length > 0 && (
        <ul className="grid gap-3 sm:grid-cols-2">
          {lista.data.map((p) => (
            <li key={p.id}>
              <Link
                to={`/proyectos/${p.id}`}
                className="flex flex-col gap-1 rounded-2xl border border-borde bg-tarjeta p-4 shadow-suave transition duration-200 hover:-translate-y-0.5 hover:border-acento/40 hover:shadow-elevada"
              >
                <span className="flex items-start justify-between gap-2">
                  <span className="font-semibold">{p.nombre}</span>
                  {!p.activo && (
                    <span className="rounded-full bg-fondo px-2 py-0.5 text-xs text-texto-secundario">Desactivado</span>
                  )}
                </span>
                {(p.ciudad || p.pais) && (
                  <span className="flex items-center gap-1 text-sm text-texto-secundario">
                    <MapPin size={16} strokeWidth={1.75} aria-hidden />
                    {[p.ciudad, p.pais].filter(Boolean).join(', ')}
                  </span>
                )}
                <span className="flex items-center gap-1 text-sm text-texto-tenue">
                  <Users size={16} strokeWidth={1.75} aria-hidden />
                  {p.asignadosVigentes} {p.asignadosVigentes === 1 ? 'persona asignada' : 'personas asignadas'} · {p.moneda}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
