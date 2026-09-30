/// <reference types="vite/client" />

// Variables VITE_* que usa la interfaz. Todas son públicas: quedan dentro del JavaScript.
interface ImportMetaEnv {
  readonly VITE_API_URL?: string
  readonly VITE_SITE_URL?: string
  /** «true» muestra las cuentas de demostración al ingresar. Solo se define en el servidor de la demo. */
  readonly VITE_DEMO?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
