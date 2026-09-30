/**
 * Cliente HTTP único de la interfaz.
 *
 * Toda llamada a la API pasa por aquí: arma la URL, adjunta el token de acceso,
 * convierte los nombres de snake_case (API) a camelCase (TypeScript) y traduce los
 * errores a ErrorApi. Si el acceso venció, lo renueva una vez con la cookie y
 * reintenta. Ninguna vista usa fetch directamente.
 */
const URL_API = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

/** Error con la forma documentada en docs/architecture.md §4. */
export class ErrorApi extends Error {
  readonly codigo: string
  readonly estado: number
  readonly campos?: Record<string, string[]>

  constructor(codigo: string, mensaje: string, estado: number, campos?: Record<string, string[]>) {
    super(mensaje)
    this.name = 'ErrorApi'
    this.codigo = codigo
    this.estado = estado
    this.campos = campos
  }
}

// ── Token de acceso: solo en memoria, nunca en localStorage ─────────────────
let tokenAcceso: string | null = null
let alExpirarSesion: () => void = () => {}

export const fijarToken = (token: string | null) => {
  tokenAcceso = token
}
export const alExpirar = (accion: () => void) => {
  alExpirarSesion = accion
}

const aCamel = (texto: string) => texto.replace(/_([a-z])/g, (_, letra: string) => letra.toUpperCase())
const aSnake = (texto: string) => texto.replace(/[A-Z]/g, (letra) => `_${letra.toLowerCase()}`)

/** Cuerpo JSON de una petición: convierte las claves de camelCase a snake_case. */
export const comoJson = (datos: Record<string, unknown>) =>
  JSON.stringify(Object.fromEntries(Object.entries(datos).map(([k, v]) => [aSnake(k), v])))

function convertirClaves(valor: unknown): unknown {
  if (Array.isArray(valor)) return valor.map(convertirClaves)
  if (valor !== null && typeof valor === 'object') {
    return Object.fromEntries(
      Object.entries(valor as Record<string, unknown>).map(([k, v]) => [aCamel(k), convertirClaves(v)]),
    )
  }
  return valor
}

async function enviar(ruta: string, opciones: RequestInit): Promise<Response> {
  try {
    return await fetch(`${URL_API}${ruta}`, {
      ...opciones,
      // La cookie de renovación solo viaja a /api/auth/; el resto de la API usa el token
      credentials: ruta.startsWith('/api/auth/') ? 'include' : 'omit',
      headers: {
        'Content-Type': 'application/json',
        ...(tokenAcceso ? { Authorization: `Bearer ${tokenAcceso}` } : {}),
        ...opciones.headers,
      },
    })
  } catch {
    throw new ErrorApi('sin_conexion', 'No fue posible conectar con el servidor.', 0)
  }
}

// Una sola renovación a la vez, aunque varias peticiones reciban 401 al mismo tiempo
let renovando: Promise<boolean> | null = null

export function renovarAcceso(): Promise<boolean> {
  renovando ??= (async () => {
    const r = await enviar('/api/auth/token/refresh/', { method: 'POST' }).catch(() => null)
    const datos = r?.ok ? ((await r.json()) as { acceso: string }) : null
    fijarToken(datos?.acceso ?? null)
    return Boolean(datos)
  })().finally(() => {
    renovando = null
  })
  return renovando
}

export async function pedir<T>(ruta: string, opciones: RequestInit = {}, reintento = true): Promise<T> {
  const respuesta = await enviar(ruta, opciones)

  if (respuesta.status === 401 && reintento && !ruta.startsWith('/api/auth/')) {
    if (await renovarAcceso()) return pedir<T>(ruta, opciones, false)
    alExpirarSesion()
  }

  if (respuesta.status === 204) return undefined as T
  const cuerpo: unknown = await respuesta.json().catch(() => null)
  const datos = convertirClaves(cuerpo) as T & { error?: string; mensaje?: string; campos?: Record<string, string[]> }

  if (!respuesta.ok) {
    throw new ErrorApi(
      datos?.error ?? 'error',
      datos?.mensaje ?? 'No se pudo completar la solicitud.',
      respuesta.status,
      datos?.campos,
    )
  }
  return datos
}
