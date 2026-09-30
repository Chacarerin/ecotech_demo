import { useQuery } from '@tanstack/react-query'
import {
  ArrowUpRight,
  Building2,
  CalendarDays,
  CircleCheck,
  CircleDashed,
  Circle,
  FolderKanban,
  GitBranch,
  UserRoundCheck,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'

import type { Rol } from '../api/recursos/auth'
import { departamentos, empleados } from '../api/recursos/organizacion'
import { asignaciones, proyectos } from '../api/recursos/proyectos'
import { useSesion } from '../auth/contexto'
import CurvasDeNivel from '../components/CurvasDeNivel'
import EstadoConexion from '../components/EstadoConexion'
import { MODULOS } from '../components/navegacion'
import { fecha } from '../lib/formato'
import { avance, HITOS, REPOSITORIO, type EstadoHito } from '../lib/hojaDeRuta'
import { NOMBRE_ROL, saludo } from '../lib/persona'

interface Indicador {
  etiqueta: string
  valor: string | number | undefined
  icono: LucideIcon
  ruta?: string
  detalle?: string
}

/** Cifras del panel según el rol. Cada una sale de la API con el alcance de ese rol. */
function useIndicadores(rol: Rol): Indicador[] {
  const esAdmin = rol === 'administrador'
  const esGerente = rol === 'gerente'
  const deptos = useQuery({ queryKey: ['panel', 'departamentos'], queryFn: departamentos.listar, enabled: rol !== 'empleado' })
  const personas = useQuery({ queryKey: ['panel', 'empleados'], queryFn: () => empleados.listar() })
  const obras = useQuery({ queryKey: ['panel', 'proyectos'], queryFn: () => proyectos.listar() })
  const vigentes = useQuery({
    queryKey: ['panel', 'asignaciones'],
    queryFn: () => asignaciones.vigentes(),
    enabled: rol !== 'empleado',
  })
  const activos = obras.data?.filter((p) => p.activo)

  if (esAdmin) {
    return [
      { etiqueta: 'Departamentos', valor: deptos.data?.length, icono: Building2, ruta: '/departamentos' },
      { etiqueta: 'Empleados', valor: personas.data?.length, icono: Users, ruta: '/empleados' },
      { etiqueta: 'Proyectos activos', valor: activos?.length, icono: FolderKanban, ruta: '/proyectos' },
      { etiqueta: 'Asignaciones vigentes', valor: vigentes.data?.length, icono: UserRoundCheck, ruta: '/proyectos' },
    ]
  }
  if (esGerente) {
    const mio = deptos.data?.[0]
    return [
      { etiqueta: 'Mi departamento', valor: mio?.nombre ?? '—', icono: Building2, detalle: mio && `${mio.cantidadEmpleados} integrantes` },
      { etiqueta: 'Proyectos activos', valor: activos?.length, icono: FolderKanban, ruta: '/proyectos' },
      { etiqueta: 'Mi equipo asignado', valor: vigentes.data?.length, icono: UserRoundCheck, ruta: '/proyectos', detalle: 'asignaciones vigentes' },
    ]
  }
  const yo = personas.data?.[0]
  return [
    { etiqueta: 'Mis proyectos', valor: activos?.length, icono: FolderKanban, detalle: activos?.map((p) => p.nombre).join(' · ') },
    { etiqueta: 'Mi departamento', valor: yo?.departamentoNombre ?? '—', icono: Building2 },
    { etiqueta: 'En EcoTech desde', valor: yo && fecha(yo.fechaInicio), icono: CalendarDays },
  ]
}

function TarjetaIndicador({ etiqueta, valor, icono: Icono, ruta, detalle }: Indicador) {
  const texto = typeof valor === 'string'
  const contenido = (
    <>
      <span className="flex items-center justify-between">
        <span className="flex size-10 items-center justify-center rounded-xl bg-acento/10 text-acento transition-colors group-hover:bg-acento group-hover:text-sobre-acento">
          <Icono size={20} strokeWidth={1.75} aria-hidden />
        </span>
        {ruta && (
          <ArrowUpRight
            size={18}
            strokeWidth={1.75}
            className="text-texto-tenue opacity-0 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100"
            aria-hidden
          />
        )}
      </span>
      <span className={`font-display font-bold tracking-tight ${texto ? 'text-2xl leading-tight' : 'text-4xl'}`}>
        {valor ?? <span className="inline-block h-9 w-12 animate-pulse rounded-lg bg-superficie align-middle" />}
      </span>
      <span className="flex flex-col">
        <span className="text-sm font-medium text-texto-secundario">{etiqueta}</span>
        {detalle && <span className="line-clamp-1 text-xs text-texto-tenue">{detalle}</span>}
      </span>
    </>
  )
  const clases =
    'group flex h-full flex-col gap-3 rounded-2xl border border-borde bg-tarjeta p-5 shadow-suave transition duration-200'
  return ruta ? (
    <Link to={ruta} className={`${clases} hover:-translate-y-1 hover:border-acento/40 hover:shadow-elevada`}>
      {contenido}
    </Link>
  ) : (
    <div className={clases}>{contenido}</div>
  )
}

const ICONO_HITO: Record<EstadoHito, { icono: LucideIcon; clase: string; texto: string }> = {
  listo: { icono: CircleCheck, clase: 'text-acento', texto: 'Listo' },
  proximo: { icono: CircleDashed, clase: 'text-sol', texto: 'En curso' },
  pendiente: { icono: Circle, clase: 'text-texto-tenue', texto: 'Pendiente' },
}

function HojaDeRuta() {
  const porcentaje = avance()
  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-borde bg-tarjeta p-5 shadow-suave">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">Hoja de ruta</h2>
          <p className="text-sm text-texto-tenue">Esta demostración se construye por hitos, a la vista.</p>
        </div>
        <span className="font-display text-3xl font-bold text-acento">{porcentaje}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-superficie" role="progressbar" aria-valuenow={porcentaje} aria-valuemin={0} aria-valuemax={100} aria-label="Avance del proyecto">
        {/* El ancho depende de un dato: es el único estilo en línea admitido (CLAUDE.md §7) */}
        <div className="h-full rounded-full bg-acento transition-all duration-700" style={{ width: `${porcentaje}%` }} />
      </div>
      <ol className="flex flex-col">
        {HITOS.map((h) => {
          const { icono: Icono, clase, texto } = ICONO_HITO[h.estado]
          return (
            <li
              key={h.numero}
              className="group -mx-2 flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-superficie"
            >
              <Icono size={20} strokeWidth={1.75} className={`shrink-0 ${clase}`} aria-label={texto} />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className={`text-sm font-semibold ${h.estado === 'pendiente' ? 'text-texto-secundario' : ''}`}>
                  <span className="mr-1.5 font-mono text-xs text-texto-tenue">H{h.numero}</span>
                  {h.nombre}
                </span>
                <span className="truncate text-xs text-texto-tenue">{h.detalle}</span>
              </span>
              {h.estado === 'proximo' && (
                <span className="rounded-full bg-sol/12 px-2 py-0.5 text-[11px] font-semibold text-sol">En curso</span>
              )}
            </li>
          )
        })}
      </ol>
      <a
        href={`${REPOSITORIO}/blob/main/docs/changelog.md`}
        target="_blank"
        rel="noreferrer"
        className="group flex items-center gap-2 text-sm font-semibold text-acento"
      >
        <GitBranch size={18} strokeWidth={1.75} aria-hidden />
        <span className="underline-offset-4 group-hover:underline">Ver el historial de cambios</span>
        <ArrowUpRight size={16} strokeWidth={1.75} className="transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden />
      </a>
    </section>
  )
}

export default function Panel() {
  const { usuario } = useSesion()
  const indicadores = useIndicadores(usuario!.rol)
  const accesos = MODULOS.filter((m) => m.ruta !== '/' && m.roles.includes(usuario!.rol))
  const nombre = usuario?.nombre.split(' ')[0]
  // La fecha y el saludo se calculan una vez al montar: no cambian con cada render
  const [{ hoy, bienvenida }] = useState(() => ({
    hoy: new Date().toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' }),
    bienvenida: saludo(),
  }))

  return (
    <div className="flex flex-col gap-8">
      {/* ── Bienvenida ── */}
      <section className="relative overflow-hidden rounded-3xl bg-portada px-6 py-8 text-sobre-portada shadow-elevada sm:px-8 sm:py-10">
        <CurvasDeNivel className="opacity-[0.13]" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium opacity-80 first-letter:uppercase">{hoy}</span>
            <h1 className="text-3xl font-bold sm:text-4xl">
              {bienvenida}, {nombre}
            </h1>
            <p className="opacity-85">
              {NOMBRE_ROL[usuario!.rol]} · lo que ve aquí depende de su rol
            </p>
          </div>
          <div className="self-start rounded-full bg-sobre-portada/12 px-3 py-1.5 text-sm backdrop-blur sm:self-auto">
            <EstadoConexion compacto />
          </div>
        </div>
      </section>

      {/* ── Cifras ── */}
      <section className={`grid grid-cols-2 gap-3 sm:gap-4 ${indicadores.length === 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3'}`}>
        {indicadores.map((i, n) => (
          <div key={i.etiqueta} className={`h-full ${indicadores.length === 3 && n === 0 ? 'col-span-2 lg:col-span-1' : ''}`}>
            <TarjetaIndicador {...i} />
          </div>
        ))}
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        {/* ── Accesos ── */}
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-bold">Módulos</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {accesos.map((m) =>
              m.hito ? (
                <Link
                  key={m.ruta}
                  to={m.ruta}
                  className="group flex flex-col gap-2 rounded-2xl border border-dashed border-sol/40 bg-sol/[0.04] p-4 transition hover:border-sol hover:bg-sol/[0.07]"
                >
                  <span className="flex items-center gap-2">
                    <m.icono size={20} strokeWidth={1.75} className="text-sol" aria-hidden />
                    <span className="font-semibold">{m.nombre}</span>
                    <span className="ml-auto rounded-full bg-sol/12 px-2 py-0.5 font-mono text-[11px] font-semibold text-sol">
                      Hito {m.hito}
                    </span>
                  </span>
                  <span className="text-sm text-texto-secundario">{m.descripcion}</span>
                </Link>
              ) : (
                <Link
                  key={m.ruta}
                  to={m.ruta}
                  className="group flex flex-col gap-2 rounded-2xl border border-borde bg-tarjeta p-4 shadow-suave transition duration-200 hover:-translate-y-0.5 hover:border-acento/40 hover:shadow-elevada"
                >
                  <span className="flex items-center gap-2">
                    <m.icono size={20} strokeWidth={1.75} className="text-acento" aria-hidden />
                    <span className="font-semibold">{m.nombre}</span>
                    <ArrowUpRight
                      size={18}
                      strokeWidth={1.75}
                      className="ml-auto text-texto-tenue transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-acento"
                      aria-hidden
                    />
                  </span>
                  <span className="text-sm text-texto-secundario">{m.descripcion}</span>
                </Link>
              ),
            )}
          </div>
        </section>

        <HojaDeRuta />
      </div>
    </div>
  )
}
