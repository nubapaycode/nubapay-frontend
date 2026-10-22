import type { Metadata } from 'next'

import SecurityPage from '@/components/landing-v2/SecurityPage'
import { breadcrumbJsonLd, pageMeta, SITE_URL } from '@/lib/seo'

export const metadata: Metadata = {
  ...pageMeta({
    title: 'Seguridad',
    description: 'Conocé cómo Nubapay protege cada pedido, pago y retiro en tu evento con QR único y validación antifraude.',
  }),
  alternates: { canonical: `${SITE_URL}/seguridad` },
}

const BREADCRUMB_LD = { __html: breadcrumbJsonLd([{ name: 'Seguridad', path: '/seguridad' }]) }

export default function SeguridadPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={BREADCRUMB_LD} />
      <SecurityPage />
    </>
  )
}
