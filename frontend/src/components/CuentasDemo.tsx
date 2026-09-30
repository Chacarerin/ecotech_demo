import { ChevronDown, ShieldCheck, UserRound, UsersRound, type LucideIcon } from 'lucide-react'

// Cuentas públicas de la demostración. Solo existen en el servidor de la demo, donde las crea
// `cargar_demo` con DEMO_CUENTAS=true, y solo ahí se define VITE_DEMO. Son públicas por diseño,
// no credenciales filtradas: ver docs/variables_entorno.md. La clave es igual al usuario.
export const HAY_DEMO = import.meta.env.VITE_DEMO === 'true'

interface Cuenta {
  usuario: string
  rol: string
  icono: LucideIcon
  puede: string
}

// Lo que cada rol puede hacer HOY en la interfaz. Se actualiza con cada hito.
const CUENTAS: Cuenta[] = [
  {
    usuario: 'admin',
    rol: 'Administrador',
    icono: ShieldCheck,
    puede: 'Todo: crea y edita departamentos, empleados y proyectos, y ve los datos personales.',
  },
  {
    usuario: 'gerente',
    rol: 'Gerente',
    icono: UsersRound,
    puede: 'Marta Rojas. Ve los proyectos y asigna solo a la gente de su departamento, sin datos personales.',
  },
  {
    usuario: 'empleado',
    rol: 'Empleado',
    icono: UserRound,
    puede: 'Diego Fuentes. Ve su panel; registrará sus horas cuando llegue ese módulo.',
  },
]

export default function CuentasDemo({ onElegir }: { onElegir: (usuario: string) => void }) {
  return (
    <section className="flex flex-col gap-3 text-sm" aria-labelledby="titulo-demo">
      <div className="flex items-center gap-3 text-xs text-texto-tenue">
        <span className="h-px flex-1 bg-borde" />
        <span id="titulo-demo">o pruebe con una cuenta de demostración</span>
        <span className="h-px flex-1 bg-borde" />
      </div>

      <div className="grid grid-cols-3 gap-2">
        {CUENTAS.map(({ usuario, rol, icono: Icono }) => (
          <button
            key={usuario}
            type="button"
            onClick={() => onElegir(usuario)}
            title={`Ingresar como ${usuario} / ${usuario}`}
            className="group flex flex-col items-center gap-1 rounded-xl border border-borde bg-tarjeta px-2 py-2.5 transition duration-200 hover:-translate-y-0.5 hover:border-acento/50 hover:shadow-elevada active:scale-95"
          >
            <Icono
              size={20}
              strokeWidth={1.75}
              className="text-texto-tenue transition-colors group-hover:text-acento"
              aria-hidden
            />
            <span className="text-xs font-semibold">{rol}</span>
            <span className="font-mono text-[10px] text-texto-tenue">{usuario}</span>
          </button>
        ))}
      </div>

      <details className="group rounded-xl text-xs text-texto-secundario">
        <summary className="flex cursor-pointer list-none items-center justify-center gap-1 text-texto-tenue transition-colors hover:text-acento">
          Qué puede hacer cada rol
          <ChevronDown size={14} strokeWidth={2} className="transition-transform group-open:rotate-180" aria-hidden />
        </summary>
        <dl className="mt-2 flex flex-col gap-1.5 rounded-xl border border-borde bg-tarjeta p-3">
          {CUENTAS.map(({ usuario, rol, puede }) => (
            <div key={usuario}>
              <dt className="inline font-semibold text-texto">{rol} · </dt>
              <dd className="inline">{puede}</dd>
            </div>
          ))}
          <p className="mt-1 text-texto-tenue">La clave es igual al usuario. Los datos son ficticios y se restablecen cada noche.</p>
        </dl>
      </details>
    </section>
  )
}
