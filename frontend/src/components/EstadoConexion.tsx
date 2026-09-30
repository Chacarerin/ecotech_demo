import { useQuery } from '@tanstack/react-query'
import { CircleAlert, LoaderCircle } from 'lucide-react'

import { ErrorApi } from '../api/cliente'
import { consultarSalud } from '../api/recursos/salud'

/**
 * Muestra si la interfaz alcanza a la API y si la API alcanza a su base. En su versión compacta
 * es una línea con un punto de estado, pensada para ir sobre el color de acento.
 */
export default function EstadoConexion({ compacto = false }: { compacto?: boolean }) {
  const { data, error, isPending } = useQuery({
    queryKey: ['salud'],
    queryFn: consultarSalud,
    retry: 1,
  })

  if (isPending) {
    return (
      <span className="flex items-center gap-2" role="status">
        <LoaderCircle size={16} strokeWidth={1.75} className="animate-spin" aria-hidden />
        Verificando el servidor…
      </span>
    )
  }

  if (error) {
    const mensaje = error instanceof ErrorApi ? error.message : 'Error desconocido.'
    return (
      <span className={`flex items-center gap-2 ${compacto ? '' : 'text-peligro'}`} role="alert">
        <CircleAlert size={16} strokeWidth={1.75} aria-hidden />
        {compacto ? 'Servidor sin respuesta' : mensaje}
      </span>
    )
  }

  const ok = data.base === 'ok'
  return (
    <span className="flex items-center gap-2" role="status">
      {/* Punto con pulso: el verde lima no alcanza contraste AA como texto, va solo aquí */}
      <span className="relative flex size-2.5" aria-hidden>
        {ok && <span className="absolute inline-flex size-full animate-ping rounded-full bg-positivo opacity-60" />}
        <span className={`relative inline-flex size-2.5 rounded-full ${ok ? 'bg-positivo' : 'bg-peligro'}`} />
      </span>
      {ok ? 'Servidor en línea' : 'Base de datos con problemas'}
    </span>
  )
}
