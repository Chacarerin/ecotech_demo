import { zodResolver } from '@hookform/resolvers/zod'
import { CircleAlert, FolderKanban, LoaderCircle, LockKeyhole, LogIn, UsersRound } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Navigate, useLocation, useNavigate } from 'react-router'
import { z } from 'zod'

import { ErrorApi } from '../api/cliente'
import { useSesion } from '../auth/contexto'
import BotonTema from '../components/BotonTema'
import CuentasDemo, { HAY_DEMO } from '../components/CuentasDemo'
import CurvasDeNivel from '../components/CurvasDeNivel'
import { estiloCampo } from '../components/Formulario'
import Marca from '../components/Marca'

const esquema = z.object({
  usuario: z.string().trim().min(1, 'Ingrese su usuario.'),
  clave: z.string().min(1, 'Ingrese su clave.'),
})
type Datos = z.infer<typeof esquema>

function mensajeDeError(error: unknown): string {
  if (error instanceof ErrorApi) {
    // La API no distingue usuario inexistente de clave incorrecta, y la interfaz tampoco
    if (error.estado === 401) return 'Usuario o clave incorrectos.'
    return error.message
  }
  return 'No fue posible iniciar sesión.'
}

const PUNTOS = [
  { icono: UsersRound, texto: 'Personas y departamentos, con datos personales cifrados' },
  { icono: FolderKanban, texto: 'Proyectos en tres países y quién trabaja en cada uno' },
  { icono: LockKeyhole, texto: 'Tres roles: cada uno ve solo lo que le corresponde' },
]

export default function Ingresar() {
  const { usuario, entrar } = useSesion()
  const navegar = useNavigate()
  const destino = (useLocation().state as { desde?: string } | null)?.desde ?? '/'
  const [error, setError] = useState<string | null>(null)
  const { register, handleSubmit, setValue, formState } = useForm<Datos>({ resolver: zodResolver(esquema) })

  if (usuario) return <Navigate to={destino} replace />

  const enviar = handleSubmit(async ({ usuario: nombre, clave }) => {
    setError(null)
    try {
      await entrar(nombre, clave)
      navegar(destino, { replace: true })
    } catch (e) {
      setError(mensajeDeError(e))
    }
  })

  return (
    <div className="grid min-h-svh lg:grid-cols-[1.1fr_1fr]">
      {/* ── Presentación · solo escritorio ── */}
      <aside className="relative hidden overflow-hidden bg-portada p-12 text-sobre-portada lg:flex lg:flex-col lg:justify-between">
        <CurvasDeNivel lineas={22} className="opacity-[0.14]" />
        <div className="relative">
          <Marca sobrePortada />
        </div>
        <div className="relative flex max-w-md flex-col gap-6">
          <h1 className="text-5xl leading-[1.05] font-bold">
            La gestión interna de una empresa de energía renovable.
          </h1>
          <ul className="flex flex-col gap-3">
            {PUNTOS.map(({ icono: Icono, texto }) => (
              <li key={texto} className="flex items-center gap-3 opacity-90">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-sobre-portada/12">
                  <Icono size={18} strokeWidth={1.75} aria-hidden />
                </span>
                {texto}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-sm opacity-70">Demostración académica · código abierto en GitHub</p>
      </aside>

      {/* ── Formulario ── */}
      <main className="relative flex flex-col px-4 py-6 sm:px-8">
        <div className="flex items-center justify-between lg:justify-end">
          <span className="lg:hidden">
            <Marca />
          </span>
          <BotonTema />
        </div>

        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 py-10">
          <div className="flex flex-col gap-1">
            <h2 className="text-3xl font-bold">Ingresar</h2>
            <p className="text-texto-secundario">Sistema de gestión interna de EcoTech Solutions.</p>
          </div>

          <form onSubmit={enviar} noValidate className="flex flex-col gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-semibold">Usuario</span>
              <input {...register('usuario')} autoComplete="username" className={estiloCampo} />
              {formState.errors.usuario && <span className="text-sm text-peligro">{formState.errors.usuario.message}</span>}
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-semibold">Clave</span>
              <input {...register('clave')} type="password" autoComplete="current-password" className={estiloCampo} />
              {formState.errors.clave && <span className="text-sm text-peligro">{formState.errors.clave.message}</span>}
            </label>

            {error && (
              <p className="flex items-center gap-2 rounded-xl bg-peligro/10 p-3 text-sm text-peligro" role="alert">
                <CircleAlert size={20} strokeWidth={1.75} aria-hidden />
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={formState.isSubmitting}
              className="group flex min-h-12 items-center justify-center gap-2 rounded-xl bg-acento font-semibold text-sobre-acento shadow-suave transition hover:bg-acento-hover hover:shadow-elevada active:scale-[0.98] disabled:opacity-60"
            >
              {formState.isSubmitting ? (
                <LoaderCircle size={20} strokeWidth={1.75} className="animate-spin" aria-hidden />
              ) : (
                <LogIn size={20} strokeWidth={1.75} className="transition-transform group-hover:translate-x-0.5" aria-hidden />
              )}
              Ingresar
            </button>
          </form>

          {HAY_DEMO && (
            <CuentasDemo
              onElegir={(cuenta) => {
                setValue('usuario', cuenta)
                setValue('clave', cuenta)
                void enviar()
              }}
            />
          )}
        </div>
      </main>
    </div>
  )
}
