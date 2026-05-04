import type { Metadata } from 'next'

import { LoginView } from '@/components/LoginView'
import { pageMeta } from '@/lib/seo'

export const metadata: Metadata = pageMeta({
  title: 'Crear cuenta',
  description:
    'Registrate en Nubapay y empezá a crear eventos con menú digital, cobros online y retiro con código QR.',
})

export default function RegisterPage() {
  return <LoginView initialMode="register" />
}
