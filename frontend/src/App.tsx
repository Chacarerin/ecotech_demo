import { Leaf } from 'lucide-react'

export default function App() {
  return (
    <main className="mx-auto flex min-h-svh max-w-md flex-col justify-center gap-3 px-4">
      <div className="flex items-center gap-3">
        <span className="rounded-lg bg-acento p-2 text-white">
          <Leaf size={24} strokeWidth={1.75} aria-hidden />
        </span>
        <h1 className="text-2xl font-bold">EcoTech Solutions</h1>
      </div>
      <p className="text-texto-secundario">Sistema de gestión interna</p>
    </main>
  )
}
