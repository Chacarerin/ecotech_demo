import { CircleAlert, Inbox } from 'lucide-react'

import { ErrorApi } from '../api/cliente'

export function EstadoError({ error }: { error: unknown }) {
  const mensaje = error instanceof ErrorApi ? error.message : 'No se pudo cargar la información.'
  return (
    <p className="flex items-center gap-2 rounded-lg bg-peligro/10 p-4 text-peligro" role="alert">
      <CircleAlert size={20} strokeWidth={1.75} aria-hidden />
      {mensaje}
    </p>
  )
}

export function EstadoVacio({ texto }: { texto: string }) {
  return (
    <p className="flex flex-col items-center gap-2 py-12 text-center text-texto-tenue">
      <Inbox size={32} strokeWidth={1.75} aria-hidden />
      {texto}
    </p>
  )
}
