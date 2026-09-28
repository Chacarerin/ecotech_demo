import { useQuery } from '@tanstack/react-query'
import { CircleAlert, CircleCheck, LoaderCircle } from 'lucide-react'

import { ErrorApi } from '../api/cliente'
import { consultarSalud } from '../api/recursos/salud'

/** Muestra si la interfaz alcanza a la API y si la API alcanza a su base. */
export default function EstadoConexion() {
  const { data, error, isPending } = useQuery({
    queryKey: ['salud'],
    queryFn: consultarSalud,
    retry: 1,
  })

  if (isPending) {
    return (
      <p className="flex items-center gap-2 text-texto-tenue" role="status">
        <LoaderCircle size={20} strokeWidth={1.75} className="animate-spin" aria-hidden />
        Verificando la conexión con el servidor…
      </p>
    )
  }

  if (error) {
    const mensaje = error instanceof ErrorApi ? error.message : 'Error desconocido.'
    return (
      <p className="flex items-center gap-2 text-peligro" role="alert">
        <CircleAlert size={20} strokeWidth={1.75} aria-hidden />
        {mensaje}
      </p>
    )
  }

  return (
    <p className="flex items-center gap-2 text-positivo" role="status">
      <CircleCheck size={20} strokeWidth={1.75} aria-hidden />
      Servidor en línea · base de datos {data.base === 'ok' ? 'conectada' : 'con problemas'}
    </p>
  )
}
