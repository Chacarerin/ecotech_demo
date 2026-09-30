import { useQuery } from '@tanstack/react-query'
import { Plus, Search, Users } from 'lucide-react'
import { useDeferredValue, useState } from 'react'
import { Link } from 'react-router'

import { departamentos, empleados } from '../../api/recursos/organizacion'
import Cargando from '../../components/Cargando'
import { EstadoError, EstadoVacio } from '../../components/Estados'
import { estiloCampo } from '../../components/Formulario'
import { fecha } from '../../lib/formato'

export default function ListaEmpleados() {
  const [texto, setTexto] = useState('')
  const [depto, setDepto] = useState<number | undefined>()
  // La búsqueda consulta a la API cuando el usuario deja de escribir, no en cada tecla
  const q = useDeferredValue(texto.trim())
  const lista = useQuery({ queryKey: ['empleados', { q, depto }], queryFn: () => empleados.listar({ q, departamento: depto }) })
  const deptos = useQuery({ queryKey: ['departamentos'], queryFn: departamentos.listar })

  return (
    <section className="flex flex-col gap-4">
      <header className="flex items-center justify-between gap-3">
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <Users size={24} strokeWidth={1.75} className="text-acento" aria-hidden />
          Empleados
        </h1>
        <Link
          to="/empleados/nuevo"
          className="flex min-h-12 items-center gap-2 rounded-lg bg-acento px-4 font-semibold text-white hover:bg-acento-hover"
        >
          <Plus size={20} strokeWidth={1.75} aria-hidden />
          <span>Nuevo</span>
        </Link>
      </header>

      <div className="flex flex-col gap-3 sm:flex-row">
        <label className="relative flex-1">
          <span className="sr-only">Buscar por nombre o correo</span>
          <Search size={20} strokeWidth={1.75} className="absolute top-3.5 left-3 text-texto-tenue" aria-hidden />
          <input
            type="search"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Buscar por nombre o correo"
            className={`${estiloCampo} pl-10`}
          />
        </label>
        <label className="sm:w-60">
          <span className="sr-only">Filtrar por departamento</span>
          <select
            value={depto ?? ''}
            onChange={(e) => setDepto(e.target.value ? Number(e.target.value) : undefined)}
            className={estiloCampo}
          >
            <option value="">Todos los departamentos</option>
            {deptos.data?.map((d) => (
              <option key={d.id} value={d.id}>
                {d.nombre}
              </option>
            ))}
          </select>
        </label>
      </div>

      {lista.isPending && <Cargando />}
      {lista.error && <EstadoError error={lista.error} />}
      {lista.data?.length === 0 && (
        <EstadoVacio texto={q || depto ? 'Ningún empleado coincide con la búsqueda.' : 'Aún no hay empleados registrados.'} />
      )}

      {lista.data && lista.data.length > 0 && (
        <ul className="grid gap-3 sm:grid-cols-2">
          {lista.data.map((e) => (
            <li key={e.id}>
              <Link
                to={`/empleados/${e.id}`}
                className="flex flex-col gap-1 rounded-xl border border-borde bg-tarjeta p-4 hover:border-acento"
              >
                <span className="font-semibold">{e.nombre}</span>
                <span className="truncate text-sm text-texto-secundario">{e.correo}</span>
                <span className="text-sm text-texto-tenue">
                  {e.departamentoNombre ?? 'Sin departamento'} · desde {fecha(e.fechaInicio)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
