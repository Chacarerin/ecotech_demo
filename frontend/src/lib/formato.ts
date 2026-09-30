/** Formatos de pantalla · docs/project_spec.md §3.3. */

/** 2026-09-28 → 28-09-2026 */
export const fecha = (iso: string) => iso.split('-').reverse().join('-')

/** 1250000 → $1.250.000 */
export const pesos = (monto: number) =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(monto)

/** Hoy en formato ISO, según la zona horaria del navegador. */
export const hoyIso = () => new Date().toLocaleDateString('sv-SE')
