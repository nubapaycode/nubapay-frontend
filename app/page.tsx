import type { Metadata } from 'next'

import { LandingPage } from '@/components/LandingPage'
import { pageMeta } from '@/lib/seo'

export const metadata: Metadata = pageMeta({
  title: 'Nubapay — Pedí, pagá y retirá sin filas',
  description:
    'Menú digital, pagos móviles y retiro con QR antifraude para eventos y festivales. Sin filas, sin caos. Powered by Atendium IA y unickeys blockchain.',
})

export default function LandingRootPage() {
  return <LandingPage />
}
