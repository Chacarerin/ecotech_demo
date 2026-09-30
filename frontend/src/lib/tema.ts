import { useSyncExternalStore } from 'react'

export type Tema = 'claro' | 'oscuro'
const CLAVE = 'ecotech-tema'
const EVENTO = 'ecotech:tema'

// La fuente de verdad es la clase .dark de <html>, que public/tema.js deja puesta antes de
// pintar. Todos los botones de tema leen de ahí: si hay dos en pantalla, nunca se contradicen.
const leer = (): Tema => (document.documentElement.classList.contains('dark') ? 'oscuro' : 'claro')

function suscribir(avisar: () => void) {
  window.addEventListener(EVENTO, avisar)
  return () => window.removeEventListener(EVENTO, avisar)
}

function alternar() {
  const nuevo: Tema = leer() === 'claro' ? 'oscuro' : 'claro'
  document.documentElement.classList.toggle('dark', nuevo === 'oscuro')
  try {
    localStorage.setItem(CLAVE, nuevo)
  } catch {
    // Sin almacenamiento el cambio dura hasta recargar: no es un error que mostrar
  }
  window.dispatchEvent(new Event(EVENTO))
}

export function useTema() {
  const tema = useSyncExternalStore(suscribir, leer)
  return { tema, alternar }
}
