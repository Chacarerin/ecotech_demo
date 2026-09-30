import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { ErrorApi } from './api/cliente'
import App from './App.tsx'
import SesionProvider from './auth/SesionProvider'
import './index.css'

const clienteConsultas = new QueryClient({
  defaultOptions: {
    queries: {
      // Un 4xx no cambia por reintentar —no existe, no tiene permiso, datos inválidos—:
      // se muestra de inmediato. Se reintenta solo ante fallas de red o del servidor.
      retry: (intentos, error) =>
        !(error instanceof ErrorApi && error.estado >= 400 && error.estado < 500) && intentos < 2,
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={clienteConsultas}>
      <SesionProvider>
        <App />
      </SesionProvider>
    </QueryClientProvider>
  </StrictMode>,
)
