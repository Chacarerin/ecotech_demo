import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, CircleAlert, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate, useParams } from 'react-router'
import { z } from 'zod'

import { departamentos, empleados } from '../../api/recursos/organizacion'
import Cargando from '../../components/Cargando'
import { EstadoError } from '../../components/Estados'
import { aplicarErroresApi } from '../../components/errorApi'
import { BotonPrimario, Campo, estiloCampo } from '../../components/Formulario'

const esquema = z.object({
  nombre: z.string().trim().min(1, 'Ingrese el nombre del departamento.').max(80, 'Máximo 80 caracteres.'),
  gerente: z.number().nullable(),
})
type Datos = z.infer<typeof esquema>

export default function FormularioDepartamento() {
  const id = Number(useParams().id) || undefined
  const navegar = useNavigate()
  const cache = useQueryClient()
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null)
  const [confirmando, setConfirmando] = useState(false)

  const actual = useQuery({ queryKey: ['departamentos', id], queryFn: () => departamentos.obtener(id!), enabled: !!id })
  // El gerente se elige entre los integrantes del departamento: la misma regla que valida la API
  const integrantes = useQuery({
    queryKey: ['empleados', { departamento: id }],
    queryFn: () => empleados.listar({ departamento: id }),
    enabled: !!id,
  })

  const { register, handleSubmit, reset, setError, formState } = useForm<Datos>({
    resolver: zodResolver(esquema),
    defaultValues: { nombre: '', gerente: null },
  })
  // Igual que en el empleado: sin la lista de integrantes el select mostraría «Sin gerente»
  // y guardar quitaría al gerente sin que nadie lo pidiera.
  useEffect(() => {
    if (actual.data && integrantes.data) reset({ nombre: actual.data.nombre, gerente: actual.data.gerente })
  }, [actual.data, integrantes.data, reset])

  const volver = () => {
    void cache.invalidateQueries({ queryKey: ['departamentos'] })
    navegar('/departamentos')
  }
  const guardar = useMutation({
    mutationFn: (datos: Datos) => departamentos.guardar(datos, id),
    onSuccess: volver,
    onError: (e) => setErrorGeneral(aplicarErroresApi(e, setError)),
  })
  const eliminar = useMutation({ mutationFn: () => departamentos.eliminar(id!), onSuccess: volver })

  if (id && (actual.isPending || integrantes.isPending)) return <Cargando />
  if (actual.error) return <EstadoError error={actual.error} />

  return (
    <section className="flex max-w-lg flex-col gap-4">
      <Link to="/departamentos" className="flex min-h-12 items-center gap-2 text-texto-secundario hover:text-texto">
        <ArrowLeft size={20} strokeWidth={1.75} aria-hidden />
        Departamentos
      </Link>
      <h1 className="text-2xl font-bold">{id ? 'Editar departamento' : 'Nuevo departamento'}</h1>

      <form
        noValidate
        onSubmit={handleSubmit((d) => {
          setErrorGeneral(null)
          guardar.mutate(d)
        })}
        className="flex flex-col gap-4 rounded-xl border border-borde bg-tarjeta p-5"
      >
        <Campo etiqueta="Nombre" error={formState.errors.nombre?.message}>
          <input {...register('nombre')} className={estiloCampo} />
        </Campo>

        <Campo etiqueta="Gerente" error={formState.errors.gerente?.message}>
          <select
            {...register('gerente', { setValueAs: (v) => (v === '' || v === null ? null : Number(v)) })}
            disabled={!id}
            className={estiloCampo}
          >
            <option value="">Sin gerente</option>
            {integrantes.data?.map((e) => (
              <option key={e.id} value={e.id}>
                {e.nombre}
              </option>
            ))}
          </select>
          {!id && (
            <span className="text-sm text-texto-tenue">
              Primero cree el departamento y asígnele empleados; después podrá elegir su gerente.
            </span>
          )}
        </Campo>

        {errorGeneral && (
          <p className="flex items-center gap-2 rounded-lg bg-peligro/10 p-3 text-sm text-peligro" role="alert">
            <CircleAlert size={20} strokeWidth={1.75} aria-hidden />
            {errorGeneral}
          </p>
        )}
        <BotonPrimario cargando={guardar.isPending}>Guardar</BotonPrimario>
      </form>

      {id && (
        <div className="flex flex-wrap items-center gap-3">
          {!confirmando ? (
            <button
              onClick={() => setConfirmando(true)}
              className="flex min-h-12 items-center gap-2 text-peligro hover:underline"
            >
              <Trash2 size={20} strokeWidth={1.75} aria-hidden />
              Eliminar departamento
            </button>
          ) : (
            <>
              <span className="text-sm">Sus empleados quedarán sin departamento. ¿Confirma?</span>
              <button
                onClick={() => eliminar.mutate()}
                className="min-h-12 rounded-lg bg-peligro px-4 font-semibold text-white"
              >
                Eliminar
              </button>
              <button onClick={() => setConfirmando(false)} className="min-h-12 px-4 text-texto-secundario">
                Cancelar
              </button>
            </>
          )}
        </div>
      )}
    </section>
  )
}
