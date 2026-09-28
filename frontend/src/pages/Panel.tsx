import { useSesion } from '../auth/contexto'
import EstadoConexion from '../components/EstadoConexion'

export default function Panel() {
  const { usuario } = useSesion()
  return (
    <section className="flex flex-col gap-3">
      <h1 className="text-2xl font-bold">Panel</h1>
      <p className="text-texto-secundario">Sesión iniciada como {usuario?.nombre}.</p>
      <EstadoConexion />
    </section>
  )
}
