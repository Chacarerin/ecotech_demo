import { GraduationCap, ShieldCheck, UserRound, UsersRound, type LucideIcon } from 'lucide-react'

// Cuentas públicas de la demostración. Solo existen en el servidor de la demo, donde las crea
// `cargar_demo` con DEMO_CUENTAS=true, y solo ahí se define VITE_DEMO. Son públicas por diseño,
// no credenciales filtradas: ver docs/variables_entorno.md. La clave es igual al usuario.
export const HAY_DEMO = import.meta.env.VITE_DEMO === 'true'

interface Cuenta {
  usuario: string
  rol: string
  quien: string
  icono: LucideIcon
  puede: string[]
}

// Lo que cada rol puede hacer HOY en la interfaz. Se actualiza con cada hito.
const CUENTAS: Cuenta[] = [
  {
    usuario: 'admin',
    rol: 'Administrador',
    quien: 'Administración de EcoTech',
    icono: ShieldCheck,
    puede: [
      'Crea y edita departamentos, empleados y proyectos',
      'Ve los datos personales: dirección, teléfono y salario',
      'Asigna a cualquier empleado a cualquier proyecto',
    ],
  },
  {
    usuario: 'gerente',
    rol: 'Gerente',
    quien: 'Marta Rojas · Desarrollo Sostenible',
    icono: UsersRound,
    puede: [
      'Ve los proyectos activos y aquellos en que trabajó su gente',
      'Asigna y cierra asignaciones, solo de su departamento',
      'No ve datos personales ni crea proyectos',
    ],
  },
  {
    usuario: 'empleado',
    rol: 'Empleado',
    quien: 'Diego Fuentes · asignado a dos proyectos',
    icono: UserRound,
    puede: [
      'Entra a su panel',
      'No accede a empleados, departamentos ni proyectos',
      'Registrará sus horas cuando esté listo ese módulo',
    ],
  },
]

export default function CuentasDemo({ onElegir }: { onElegir: (usuario: string) => void }) {
  return (
    <section className="flex flex-col gap-3 rounded-xl border border-acento/30 bg-acento/5 p-4 text-sm">
      <h2 className="flex items-center gap-2 font-semibold">
        <GraduationCap size={20} strokeWidth={1.75} className="text-acento" aria-hidden />
        Demostración académica · una cuenta por rol
      </h2>
      <p className="text-texto-secundario">
        La clave es igual al usuario. Los datos son ficticios y se restablecen cada noche. Pruebe el
        mismo recorrido con los tres roles: lo que cambia es lo que la API permite a cada uno.
      </p>
      <ul className="flex flex-col gap-2">
        {CUENTAS.map(({ usuario, rol, quien, icono: Icono, puede }) => (
          <li key={usuario}>
            <button
              type="button"
              onClick={() => onElegir(usuario)}
              className="flex w-full flex-col gap-1 rounded-lg border border-borde bg-tarjeta p-3 text-left hover:border-acento"
            >
              <span className="flex items-center gap-2">
                <Icono size={18} strokeWidth={1.75} className="text-acento" aria-hidden />
                <span className="font-semibold">{rol}</span>
                <span className="ml-auto font-mono text-xs text-texto-secundario">
                  {usuario} / {usuario}
                </span>
              </span>
              <span className="text-xs text-texto-tenue">{quien}</span>
              {/* Dentro de un botón solo cabe contenido en línea: la lista se arma con span */}
              <span className="mt-1 flex flex-col gap-0.5 text-xs text-texto-secundario">
                {puede.map((p) => (
                  <span key={p}>· {p}</span>
                ))}
              </span>
              <span className="mt-1 text-xs font-semibold text-acento">Ingresar como {rol.toLowerCase()} →</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
