/** Formatos de pantalla · docs/project_spec.md §3.3. */

/** 2026-09-28 → 28-09-2026 */
export const fecha = (iso: string) => iso.split('-').reverse().join('-')

/** 1250000 → $1.250.000 */
export const pesos = (monto: number) =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(monto)

/** Hoy en formato ISO, según la zona horaria del navegador. */
export const hoyIso = () => new Date().toLocaleDateString('sv-SE')

/** «7.5» → «7,5 h» · «12» → «12 h» */
export const horas = (valor: string | number) =>
  `${Number(valor).toLocaleString('es-CL', { maximumFractionDigits: 1 })} h`

/** Fecha ISO de hace n días, según la zona horaria del navegador. */
export const haceDias = (n: number) => {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toLocaleDateString('sv-SE')
}

/** 2026-09-30 → «miércoles 30» */
export const diaSemana = (iso: string) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric' })
