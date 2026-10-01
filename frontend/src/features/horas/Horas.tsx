import { useSesion } from '../../auth/contexto'
import { MODULOS } from '../../components/navegacion'
import EnConstruccion from '../../pages/EnConstruccion'
import RegistroHoras from './RegistroHoras'

/** Un mismo módulo, dos tareas distintas: el empleado registra; gerencia y administración revisan. */
export default function Horas() {
  const { usuario } = useSesion()
  if (usuario?.rol === 'empleado') return <RegistroHoras />
  const modulo = MODULOS.find((m) => m.ruta === '/horas')!
  return <EnConstruccion modulo={{ ...modulo, hito: 5 }} />
}
