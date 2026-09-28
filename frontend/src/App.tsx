import { createBrowserRouter, RouterProvider } from 'react-router'

import RutaProtegida from './auth/RutaProtegida'
import Layout from './components/Layout'
import { MODULOS } from './components/navegacion'
import EnConstruccion from './pages/EnConstruccion'
import Ingresar from './pages/Ingresar'
import Panel from './pages/Panel'

const rutas = createBrowserRouter([
  { path: '/ingresar', element: <Ingresar /> },
  {
    path: '/',
    element: (
      <RutaProtegida>
        <Layout />
      </RutaProtegida>
    ),
    children: [
      { index: true, element: <Panel /> },
      // Cada módulo exige los mismos roles con que aparece en la navegación
      ...MODULOS.filter((m) => m.ruta !== '/').map((m) => ({
        path: m.ruta.slice(1),
        element: (
          <RutaProtegida roles={m.roles}>
            <EnConstruccion modulo={m} />
          </RutaProtegida>
        ),
      })),
    ],
  },
])

export default function App() {
  return <RouterProvider router={rutas} />
}
