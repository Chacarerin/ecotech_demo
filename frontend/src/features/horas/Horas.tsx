import { useSesion } from '../../auth/contexto'
import RegistroHoras from './RegistroHoras'
import RevisionHoras from './RevisionHoras'

/** Un mismo módulo, dos tareas distintas: el empleado registra; gerencia y administración revisan. */
export default function Horas() {
  const { usuario } = useSesion()
  return usuario?.rol === 'empleado' ? <RegistroHoras /> : <RevisionHoras />
}
