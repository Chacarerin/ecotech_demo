import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, CircleAlert, Lock, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate, useParams } from 'react-router'
import { z } from 'zod'

import { departamentos, empleados } from '../../api/recursos/organizacion'
import Cargando from '../../components/Cargando'
import { EstadoError } from '../../components/Estados'
import { aplicarErroresApi } from '../../components/errorApi'
import { BotonPrimario, Campo, estiloCampo } from '../../components/Formulario'
import { hoyIso } from '../../lib/formato'

// Reproduce las reglas de docs/project_spec.md §4.1 para responder al instante; decide la API
const esquema = z.object({
  nombre: z.string().trim().min(1, 'Ingrese el nombre.').max(120, 'Máximo 120 caracteres.'),
  correo: z.email('Ingrese un correo válido.'),
  fechaInicio: z
    .string()
    .min(1, 'Ingrese la fecha de inicio.')
    .refine((f) => f <= hoyIso(), 'La fecha de inicio no puede ser futura.'),
  departamento: z.number().nullable(),
  telefono: z
    .string()
    .trim()
    .refine((t) => t === '' || /^\+56 ?9 ?\d{4} ?\d{4}$/.test(t), 'Ingrese un teléfono con el formato +56 9 XXXX XXXX.'),
  direccion: z.string().trim().max(200, 'Máximo 200 caracteres.'),
  salario: z.number({ error: 'Ingrese el salario.' }).int('Ingrese un monto sin decimales.').positive('El salario debe ser mayor que cero.'),
})
type Datos = z.infer<typeof esquema>

export default function FormularioEmpleado() {
  const id = Number(useParams().id) || undefined
  const navegar = useNavigate()
  const cache = useQueryClient()
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null)
  const [confirmando, setConfirmando] = useState(false)

  const actual = useQuery({ queryKey: ['empleados', id], queryFn: () => empleados.obtener(id!), enabled: !!id })
  const deptos = useQuery({ queryKey: ['departamentos'], queryFn: departamentos.listar })

  const { register, handleSubmit, reset, setError, formState } = useForm<Datos>({
    resolver: zodResolver(esquema),
    defaultValues: { nombre: '', correo: '', fechaInicio: '', departamento: null, telefono: '', direccion: '' },
  })
  // Se cargan los valores solo cuando también llegaron los departamentos: si el select no
  // tiene todavía la opción, muestra «Sin departamento» y guardar sacaría al empleado de él.
  useEffect(() => {
    const e = actual.data
    if (e && deptos.data) {
      reset({
        nombre: e.nombre, correo: e.correo, fechaInicio: e.fechaInicio, departamento: e.departamento,
        telefono: e.telefono ?? '', direccion: e.direccion ?? '', salario: e.salario,
      })
    }
  }, [actual.data, deptos.data, reset])

  const volver = () => {
    void cache.invalidateQueries({ queryKey: ['empleados'] })
    void cache.invalidateQueries({ queryKey: ['departamentos'] })
    navegar('/empleados')
  }
  const guardar = useMutation({
    mutationFn: (d: Datos) => empleados.guardar(d, id),
    onSuccess: volver,
    onError: (e) => setErrorGeneral(aplicarErroresApi(e, setError)),
  })
  const eliminar = useMutation({ mutationFn: () => empleados.eliminar(id!), onSuccess: volver })

  if ((id && actual.isPending) || deptos.isPending) return <Cargando />
  if (actual.error) return <EstadoError error={actual.error} />
  const err = formState.errors

  return (
    <section className="flex max-w-lg flex-col gap-4">
      <Link to="/empleados" className="flex min-h-12 items-center gap-2 text-texto-secundario hover:text-texto">
        <ArrowLeft size={20} strokeWidth={1.75} aria-hidden />
        Empleados
      </Link>
      <h1 className="text-3xl font-bold">{id ? 'Editar empleado' : 'Nuevo empleado'}</h1>
      {id && <p className="font-mono text-sm text-texto-tenue">ID {id} · asignado por el sistema</p>}

      <form
        noValidate
        onSubmit={handleSubmit((d) => {
          setErrorGeneral(null)
          guardar.mutate(d)
        })}
        className="flex flex-col gap-4 rounded-2xl border border-borde bg-tarjeta p-5 shadow-suave"
      >
        <Campo etiqueta="Nombre completo" error={err.nombre?.message}>
          <input {...register('nombre')} autoComplete="off" className={estiloCampo} />
        </Campo>
        <Campo etiqueta="Correo" error={err.correo?.message}>
          <input {...register('correo')} type="email" inputMode="email" autoComplete="off" className={estiloCampo} />
        </Campo>
        <Campo etiqueta="Fecha de inicio" error={err.fechaInicio?.message}>
          <input {...register('fechaInicio')} type="date" max={hoyIso()} className={estiloCampo} />
        </Campo>
        <Campo etiqueta="Departamento" error={err.departamento?.message}>
          <select
            {...register('departamento', { setValueAs: (v) => (v === '' || v === null ? null : Number(v)) })}
            className={estiloCampo}
          >
            <option value="">Sin departamento</option>
            {deptos.data?.map((d) => (
              <option key={d.id} value={d.id}>
                {d.nombre}
              </option>
            ))}
          </select>
        </Campo>

        <fieldset className="flex flex-col gap-4 rounded-xl border border-borde p-4">
          <legend className="flex items-center gap-1 px-1 text-sm font-semibold text-texto-secundario">
            <Lock size={16} strokeWidth={1.75} aria-hidden />
            Datos personales · se guardan cifrados
          </legend>
          <Campo etiqueta="Teléfono" error={err.telefono?.message}>
            <input {...register('telefono')} type="tel" inputMode="tel" placeholder="+56 9 1234 5678" className={estiloCampo} />
          </Campo>
          <Campo etiqueta="Dirección" error={err.direccion?.message}>
            <input {...register('direccion')} autoComplete="off" className={estiloCampo} />
          </Campo>
          <Campo etiqueta="Salario mensual (pesos)" error={err.salario?.message}>
            <input {...register('salario', { valueAsNumber: true })} type="number" inputMode="numeric" min={1} step={1} className={estiloCampo} />
          </Campo>
        </fieldset>

        {errorGeneral && (
          <p className="flex items-center gap-2 rounded-xl bg-peligro/10 p-3 text-sm text-peligro" role="alert">
            <CircleAlert size={20} strokeWidth={1.75} aria-hidden />
            {errorGeneral}
          </p>
        )}
        <BotonPrimario cargando={guardar.isPending}>Guardar</BotonPrimario>
      </form>

      {id && (
        <div className="flex flex-wrap items-center gap-3">
          {!confirmando ? (
            <button onClick={() => setConfirmando(true)} className="flex min-h-12 items-center gap-2 text-peligro hover:underline">
              <Trash2 size={20} strokeWidth={1.75} aria-hidden />
              Eliminar empleado
            </button>
          ) : (
            <>
              <span className="text-sm">Se eliminará su ficha. ¿Confirma?</span>
              <button onClick={() => eliminar.mutate()} className="min-h-12 rounded-xl bg-peligro px-4 font-semibold text-tarjeta">
                Eliminar
              </button>
              <button onClick={() => setConfirmando(false)} className="min-h-12 px-4 text-texto-secundario">
                Cancelar
              </button>
            </>
          )}
          {eliminar.error && <EstadoError error={eliminar.error} />}
        </div>
      )}
    </section>
  )
}
