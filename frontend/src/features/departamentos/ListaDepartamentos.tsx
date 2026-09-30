import { useQuery } from '@tanstack/react-query'
import { Building2, Plus, Users } from 'lucide-react'
import { Link } from 'react-router'

import { departamentos } from '../../api/recursos/organizacion'
import Cargando from '../../components/Cargando'
import { EstadoError, EstadoVacio } from '../../components/Estados'

export default function ListaDepartamentos() {
  const { data, error, isPending } = useQuery({ queryKey: ['departamentos'], queryFn: departamentos.listar })

  return (
    <section className="flex flex-col gap-4">
      <header className="flex items-center justify-between gap-3">
        <h1 className="flex items-center gap-2 text-3xl font-bold">
          <Building2 size={24} strokeWidth={1.75} className="text-acento" aria-hidden />
          Departamentos
        </h1>
        <Link
          to="/departamentos/nuevo"
          className="flex min-h-12 items-center gap-2 rounded-xl bg-acento px-4 font-semibold text-sobre-acento shadow-suave transition hover:bg-acento-hover hover:shadow-elevada active:scale-[0.98]"
        >
          <Plus size={20} strokeWidth={1.75} aria-hidden />
          <span>Nuevo</span>
        </Link>
      </header>

      {isPending && <Cargando />}
      {error && <EstadoError error={error} />}
      {data?.length === 0 && <EstadoVacio texto="Aún no hay departamentos. Cree el primero con «Nuevo»." />}

      {data && data.length > 0 && (
        <ul className="grid gap-3 sm:grid-cols-2">
          {data.map((d) => (
            <li key={d.id}>
              <Link
                to={`/departamentos/${d.id}`}
                className="flex flex-col gap-1 rounded-2xl border border-borde bg-tarjeta p-4 shadow-suave transition duration-200 hover:-translate-y-0.5 hover:border-acento/40 hover:shadow-elevada"
              >
                <span className="font-semibold">{d.nombre}</span>
                <span className="text-sm text-texto-secundario">Gerente: {d.gerenteNombre ?? 'sin asignar'}</span>
                <span className="flex items-center gap-1 text-sm text-texto-tenue">
                  <Users size={16} strokeWidth={1.75} aria-hidden />
                  {d.cantidadEmpleados} {d.cantidadEmpleados === 1 ? 'empleado' : 'empleados'}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
