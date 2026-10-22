import type { Metadata } from 'next'

import NotFoundPage from '@/components/landing-v2/NotFoundPage'

export const metadata: Metadata = {
  title: '404 — Página no encontrada',
  robots: { index: false, follow: false },
}

export default function NotFound() {
  return <NotFoundPage />
}
