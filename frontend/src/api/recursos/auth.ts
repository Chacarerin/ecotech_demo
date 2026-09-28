import { fijarToken, pedir, renovarAcceso } from '../cliente'

export type Rol = 'administrador' | 'gerente' | 'empleado'

export interface Usuario {
  id: number
  username: string
  nombre: string
  rol: Rol
}

export async function iniciarSesion(usuario: string, clave: string): Promise<void> {
  const { acceso } = await pedir<{ acceso: string }>('/api/auth/token/', {
    method: 'POST',
    body: JSON.stringify({ username: usuario, password: clave }),
  })
  fijarToken(acceso)
}

export async function cerrarSesion(): Promise<void> {
  await pedir<void>('/api/auth/logout/', { method: 'POST' }).catch(() => undefined)
  fijarToken(null)
}

export const usuarioActual = () => pedir<Usuario>('/api/auth/yo/')

/** Al recargar la página el token en memoria se pierde: la cookie permite recuperarlo. */
export const recuperarSesion = () => renovarAcceso()
