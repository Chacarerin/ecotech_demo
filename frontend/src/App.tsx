import { createBrowserRouter, RouterProvider } from 'react-router'

import RutaProtegida from './auth/RutaProtegida'
import Layout from './components/Layout'
import { MODULOS } from './components/navegacion'
import EnConstruccion from './pages/EnConstruccion'
import Ingresar from './pages/Ingresar'
import Panel from './pages/Panel'
import FormularioDepartamento from './features/departamentos/FormularioDepartamento'
import FormularioEmpleado from './features/empleados/FormularioEmpleado'
import ListaEmpleados from './features/empleados/ListaEmpleados'
import ListaDepartamentos from './features/departamentos/ListaDepartamentos'

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
      // Módulos construidos: cada uno exige los mismos roles con que aparece en la navegación
      ...[
        { path: 'departamentos', element: <ListaDepartamentos /> },
        { path: 'departamentos/nuevo', element: <FormularioDepartamento /> },
        { path: 'departamentos/:id', element: <FormularioDepartamento /> },
        { path: 'empleados', element: <ListaEmpleados /> },
        { path: 'empleados/nuevo', element: <FormularioEmpleado /> },
        { path: 'empleados/:id', element: <FormularioEmpleado /> },
      ].map((r) => ({ ...r, element: <RutaProtegida roles={['administrador']}>{r.element}</RutaProtegida> })),
      // Módulos aún en construcción
      ...MODULOS.filter((m) => m.hito).map((m) => ({
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
