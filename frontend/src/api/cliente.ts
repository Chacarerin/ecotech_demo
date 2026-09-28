/**
 * Cliente HTTP único de la interfaz.
 *
 * Toda llamada a la API pasa por aquí: arma la URL, envía JSON, convierte los
 * nombres de snake_case (API) a camelCase (TypeScript) y traduce los errores a
 * ErrorApi, con la misma forma que devuelve el backend. Ninguna vista usa fetch
 * directamente.
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

const aCamel = (texto: string) => texto.replace(/_([a-z])/g, (_, letra: string) => letra.toUpperCase())

function convertirClaves(valor: unknown): unknown {
  if (Array.isArray(valor)) return valor.map(convertirClaves)
  if (valor !== null && typeof valor === 'object') {
    return Object.fromEntries(
      Object.entries(valor as Record<string, unknown>).map(([k, v]) => [aCamel(k), convertirClaves(v)]),
    )
  }
  return valor
}

export async function pedir<T>(ruta: string, opciones: RequestInit = {}): Promise<T> {
  let respuesta: Response
  try {
    respuesta = await fetch(`${URL_API}${ruta}`, {
      ...opciones,
      headers: { 'Content-Type': 'application/json', ...opciones.headers },
    })
  } catch {
    throw new ErrorApi('sin_conexion', 'No fue posible conectar con el servidor.', 0)
  }

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
