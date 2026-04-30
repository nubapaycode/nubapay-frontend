import type { Metadata } from 'next'

import { LoginView } from '@/components/LoginView'
import { pageMeta } from '@/lib/seo'

export const metadata: Metadata = pageMeta({
  title: 'Iniciar sesión',
  description:
    'Accedé al panel de organizador para cargar el menú, cobrar pedidos y gestionar retiros con Nubapay.',
})

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-gray-100">
      <LoginView />
    </main>
  )
}
