import type { Metadata } from 'next'

import HelpPage from '@/components/landing-v2/HelpPage'
import { ALL_HELP_FAQS } from '@/lib/help/helpContent'
import { breadcrumbJsonLd, pageMeta, SITE_URL } from '@/lib/seo'

export const metadata: Metadata = {
  ...pageMeta({
    title: 'Centro de ayuda',
    description:
      'Respuestas sobre compras, QR, entradas, pagos y el panel de Nubapay. Si no encontrás lo que buscás, escribinos desde el formulario.',
  }),
  alternates: { canonical: `${SITE_URL}/ayuda` },
}

const BREADCRUMB_LD = { __html: breadcrumbJsonLd([{ name: 'Centro de ayuda', path: '/ayuda' }]) }

const FAQ_LD = {
  __html: JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: ALL_HELP_FAQS.map(f => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  }),
}

export default function AyudaPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={BREADCRUMB_LD} />
      <script type="application/ld+json" dangerouslySetInnerHTML={FAQ_LD} />
      <HelpPage />
    </>
  )
}
