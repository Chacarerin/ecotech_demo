import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, CircleAlert, MapPin } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate, useParams } from 'react-router'
import { z } from 'zod'

import { proyectos, type Proyecto } from '../../api/recursos/proyectos'
import { useSesion } from '../../auth/contexto'
import Cargando from '../../components/Cargando'
import { EstadoError } from '../../components/Estados'
import { aplicarErroresApi } from '../../components/errorApi'
import { BotonPrimario, Campo, estiloCampo } from '../../components/Formulario'
import { fecha } from '../../lib/formato'
import Asignaciones from './Asignaciones'

const coordenada = (limite: number) =>
  z
    .string()
    .trim()
    .refine((v) => v === '' || (/^-?\d{1,3}(\.\d{1,5})?$/.test(v) && Math.abs(Number(v)) <= limite),
      `Ingrese un valor entre -${limite} y ${limite}, con hasta cinco decimales.`)

const esquema = z.object({
  nombre: z.string().trim().min(1, 'Ingrese el nombre del proyecto.').max(120, 'Máximo 120 caracteres.'),
  descripcion: z.string().trim(),
  fechaInicio: z.string().min(1, 'Ingrese la fecha de inicio.'),
  ciudad: z.string().trim().max(80),
  pais: z.string().trim().max(80),
  latitud: coordenada(90),
  longitud: coordenada(180),
  moneda: z.enum(['CLP', 'USD', 'EUR']),
  activo: z.boolean(),
})
type Datos = z.infer<typeof esquema>

const aFormulario = (p: Proyecto): Datos => ({
  nombre: p.nombre, descripcion: p.descripcion, fechaInicio: p.fechaInicio, ciudad: p.ciudad, pais: p.pais,
  latitud: p.latitud ?? '', longitud: p.longitud ?? '', moneda: p.moneda, activo: p.activo,
})

export default function FichaProyecto() {
  const id = Number(useParams().id) || undefined
  const { usuario } = useSesion()
  const esAdmin = usuario?.rol === 'administrador'
  const actual = useQuery({ queryKey: ['proyectos', id], queryFn: () => proyectos.obtener(id!), enabled: !!id })

  if (id && actual.isPending) return <Cargando />
  if (actual.error) return <EstadoError error={actual.error} />

  return (
    <section className="flex max-w-2xl flex-col gap-4">
      <Link to="/proyectos" className="flex min-h-12 items-center gap-2 text-texto-secundario hover:text-texto">
        <ArrowLeft size={20} strokeWidth={1.75} aria-hidden />
        Proyectos
      </Link>
      {esAdmin ? <FormularioProyecto id={id} actual={actual.data} /> : actual.data && <Resumen p={actual.data} />}
      {id && actual.data && <Asignaciones proyecto={actual.data} />}
    </section>
  )
}

/** Lo que ve el gerente: el proyecto sin poder editarlo. */
function Resumen({ p }: { p: Proyecto }) {
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-borde bg-tarjeta p-5 shadow-suave">
      <h1 className="text-3xl font-bold">{p.nombre}</h1>
      {p.descripcion && <p className="text-texto-secundario">{p.descripcion}</p>}
      <p className="flex items-center gap-1 text-sm text-texto-secundario">
        <MapPin size={16} strokeWidth={1.75} aria-hidden />
        {[p.ciudad, p.pais].filter(Boolean).join(', ') || 'Sin ubicación'} · desde {fecha(p.fechaInicio)} · {p.moneda}
      </p>
      {!p.activo && <p className="text-sm font-semibold text-texto-secundario">Proyecto desactivado</p>}
    </div>
  )
}

function FormularioProyecto({ id, actual }: { id?: number; actual?: Proyecto }) {
  const navegar = useNavigate()
  const cache = useQueryClient()
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null)
  const { register, handleSubmit, reset, setError, formState } = useForm<Datos>({
    resolver: zodResolver(esquema),
    defaultValues: { nombre: '', descripcion: '', fechaInicio: '', ciudad: '', pais: '', latitud: '', longitud: '', moneda: 'CLP', activo: true },
  })
  useEffect(() => {
    if (actual) reset(aFormulario(actual))
  }, [actual, reset])

  const guardar = useMutation({
    mutationFn: (d: Datos) =>
      proyectos.guardar({ ...d, latitud: d.latitud || null, longitud: d.longitud || null }, id),
    onSuccess: (p) => {
      void cache.invalidateQueries({ queryKey: ['proyectos'] })
      navegar(id ? '/proyectos' : `/proyectos/${p.id}`)
    },
    onError: (e) => setErrorGeneral(aplicarErroresApi(e, setError)),
  })
  const err = formState.errors

  return (
    <>
      <h1 className="text-3xl font-bold">{id ? 'Editar proyecto' : 'Nuevo proyecto'}</h1>
      <form
        noValidate
        onSubmit={handleSubmit((d) => {
          setErrorGeneral(null)
          guardar.mutate(d)
        })}
        className="flex flex-col gap-4 rounded-2xl border border-borde bg-tarjeta p-5 shadow-suave"
      >
        <Campo etiqueta="Nombre" error={err.nombre?.message}>
          <input {...register('nombre')} className={estiloCampo} />
        </Campo>
        <Campo etiqueta="Descripción" error={err.descripcion?.message}>
          <textarea {...register('descripcion')} rows={3} className={estiloCampo} />
        </Campo>
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo etiqueta="Fecha de inicio" error={err.fechaInicio?.message}>
            <input {...register('fechaInicio')} type="date" className={estiloCampo} />
          </Campo>
          <Campo etiqueta="Moneda de pago" error={err.moneda?.message}>
            <select {...register('moneda')} className={estiloCampo}>
              <option value="CLP">Peso chileno (CLP)</option>
              <option value="USD">Dólar (USD)</option>
              <option value="EUR">Euro (EUR)</option>
            </select>
          </Campo>
          <Campo etiqueta="Ciudad" error={err.ciudad?.message}>
            <input {...register('ciudad')} className={estiloCampo} />
          </Campo>
          <Campo etiqueta="País" error={err.pais?.message}>
            <input {...register('pais')} className={estiloCampo} />
          </Campo>
          <Campo etiqueta="Latitud" error={err.latitud?.message}>
            <input {...register('latitud')} inputMode="decimal" placeholder="-33.04500" className={estiloCampo} />
          </Campo>
          <Campo etiqueta="Longitud" error={err.longitud?.message}>
            <input {...register('longitud')} inputMode="decimal" placeholder="-71.61900" className={estiloCampo} />
          </Campo>
        </div>
        <p className="text-sm text-texto-tenue">La ubicación permite consultar el clima del lugar en un hito posterior.</p>
        {id && (
          <label className="flex min-h-12 items-center gap-3">
            <input type="checkbox" {...register('activo')} className="size-5 accent-acento" />
            <span>Proyecto activo · un proyecto no se elimina, se desactiva</span>
          </label>
        )}
        {errorGeneral && (
          <p className="flex items-center gap-2 rounded-xl bg-peligro/10 p-3 text-sm text-peligro" role="alert">
            <CircleAlert size={20} strokeWidth={1.75} aria-hidden />
            {errorGeneral}
          </p>
        )}
        <BotonPrimario cargando={guardar.isPending}>Guardar</BotonPrimario>
      </form>
    </>
  )
}
