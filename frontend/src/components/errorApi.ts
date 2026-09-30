import type { FieldValues, Path, UseFormSetError } from 'react-hook-form'

import { ErrorApi } from '../api/cliente'

/**
 * Lleva los errores de campo que devuelve la API al formulario, junto a cada campo.
 * Devuelve el mensaje general para mostrarlo arriba, o null si todo fue de campos.
 */
export function aplicarErroresApi<T extends FieldValues>(error: unknown, setError: UseFormSetError<T>): string | null {
  if (!(error instanceof ErrorApi)) return 'No se pudo guardar.'
  if (!error.campos) return error.message
  let general: string | null = null
  for (const [campo, mensajes] of Object.entries(error.campos)) {
    const texto = Array.isArray(mensajes) ? mensajes.join(' ') : String(mensajes)
    if (campo === 'general' || campo === 'nonFieldErrors') general = texto
    else setError(campo as Path<T>, { message: texto })
  }
  return general
}
