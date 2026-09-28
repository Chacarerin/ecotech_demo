import { zodResolver } from '@hookform/resolvers/zod'
import { CircleAlert, Leaf, LoaderCircle, LogIn } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Navigate, useLocation, useNavigate } from 'react-router'
import { z } from 'zod'

import { ErrorApi } from '../api/cliente'
import { useSesion } from '../auth/contexto'

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

export default function Ingresar() {
  const { usuario, entrar } = useSesion()
  const navegar = useNavigate()
  const destino = (useLocation().state as { desde?: string } | null)?.desde ?? '/'
  const [error, setError] = useState<string | null>(null)
  const { register, handleSubmit, formState } = useForm<Datos>({ resolver: zodResolver(esquema) })

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

  const campo =
    'w-full rounded-lg border border-borde bg-tarjeta px-3 py-3 outline-none focus:border-acento focus:ring-2 focus:ring-acento/20'

  return (
    <main className="mx-auto flex min-h-svh max-w-sm flex-col justify-center gap-6 px-4">
      <div className="flex items-center gap-3">
        <span className="rounded-lg bg-acento p-2 text-white">
          <Leaf size={24} strokeWidth={1.75} aria-hidden />
        </span>
        <div>
          <h1 className="text-xl font-bold">EcoTech Solutions</h1>
          <p className="text-sm text-texto-secundario">Sistema de gestión interna</p>
        </div>
      </div>

      <form onSubmit={enviar} noValidate className="flex flex-col gap-4 rounded-xl border border-borde bg-tarjeta p-5">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-semibold">Usuario</span>
          <input {...register('usuario')} autoComplete="username" className={campo} />
          {formState.errors.usuario && <span className="text-sm text-peligro">{formState.errors.usuario.message}</span>}
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-semibold">Clave</span>
          <input {...register('clave')} type="password" autoComplete="current-password" className={campo} />
          {formState.errors.clave && <span className="text-sm text-peligro">{formState.errors.clave.message}</span>}
        </label>

        {error && (
          <p className="flex items-center gap-2 rounded-lg bg-peligro/10 p-3 text-sm text-peligro" role="alert">
            <CircleAlert size={20} strokeWidth={1.75} aria-hidden />
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={formState.isSubmitting}
          className="flex min-h-12 items-center justify-center gap-2 rounded-lg bg-acento font-semibold text-white hover:bg-acento-hover disabled:opacity-60"
        >
          {formState.isSubmitting ? (
            <LoaderCircle size={20} strokeWidth={1.75} className="animate-spin" aria-hidden />
          ) : (
            <LogIn size={20} strokeWidth={1.75} aria-hidden />
          )}
          Ingresar
        </button>
      </form>
    </main>
  )
}
