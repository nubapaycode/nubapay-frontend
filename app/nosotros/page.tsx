import type { Metadata } from 'next'

import AboutPage from '@/components/landing-v2/AboutPage'
import { breadcrumbJsonLd, pageMeta, SITE_URL } from '@/lib/seo'

export const metadata: Metadata = {
  ...pageMeta({
    title: 'Nosotros',
    description: 'Conocé al equipo detrás de Nubapay y la historia de cómo nació la plataforma para eventos masivos.',
  }),
  alternates: { canonical: `${SITE_URL}/nosotros` },
}

const BREADCRUMB_LD = { __html: breadcrumbJsonLd([{ name: 'Nosotros', path: '/nosotros' }]) }

export default function NosotrosPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={BREADCRUMB_LD} />
      <AboutPage />
    </>
  )
}
