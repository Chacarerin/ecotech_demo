import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import App from './App.tsx'
import SesionProvider from './auth/SesionProvider'
import './index.css'

const clienteConsultas = new QueryClient()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={clienteConsultas}>
      <SesionProvider>
        <App />
      </SesionProvider>
    </QueryClientProvider>
  </StrictMode>,
)
