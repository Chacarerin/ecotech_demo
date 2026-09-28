import { LoaderCircle } from 'lucide-react'

export default function Cargando({ texto = 'Cargando…' }: { texto?: string }) {
  return (
    <p className="flex items-center justify-center gap-2 py-10 text-texto-tenue" role="status">
      <LoaderCircle size={20} strokeWidth={1.75} className="animate-spin" aria-hidden />
      {texto}
    </p>
  )
}
