import { createBrowserRouter, RouterProvider } from 'react-router'

import RutaProtegida from './auth/RutaProtegida'
import Ingresar from './pages/Ingresar'
import Panel from './pages/Panel'

const rutas = createBrowserRouter([
  { path: '/ingresar', element: <Ingresar /> },
  {
    path: '/',
    element: (
      <RutaProtegida>
        <main className="mx-auto max-w-5xl px-4 py-6">
          <Panel />
        </main>
      </RutaProtegida>
    ),
  },
])

export default function App() {
  return <RouterProvider router={rutas} />
}
