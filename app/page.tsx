import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { LandingPage } from '@/components/LandingPage'
import { fetchTenantThemeForRequest } from '@/lib/fetchTenantTheme'
import { SITE_NAME, pageMeta } from '@/lib/seo'

const LANDING_META: Metadata = pageMeta({
  title: 'Nubapay — Pedí, pagá y retirá sin cajas',
  description:
    'Menú digital, pagos móviles y retiro con QR para eventos y festivales. Sin cajas, sin caos.',
})

export async function generateMetadata(): Promise<Metadata> {
  const theme = await fetchTenantThemeForRequest()
  if (!theme.dedicated_partner_host) {
    return LANDING_META
  }
  const label =
    typeof theme.resolved_subdomain === 'string' && theme.resolved_subdomain.trim()
      ? theme.resolved_subdomain.trim()
      : SITE_NAME
  return pageMeta({
    title: `Iniciar sesión · ${label}`,
    description: 'Accedé al panel de organizador.',
    robots: { index: false, follow: false },
  })
}

const FAQ_JSONLD = JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    { '@type': 'Question', name: '¿Qué es Nubapay?', acceptedAnswer: { '@type': 'Answer', text: 'Nubapay es una plataforma para eventos que permite a los asistentes comprar desde el celular, pagar online y retirar su pedido con un QR, reduciendo filas y agilizando la atención en barras o puntos de entrega.' } },
    { '@type': 'Question', name: '¿Necesito descargar una app?', acceptedAnswer: { '@type': 'Answer', text: 'No. Nubapay funciona desde una web app responsive, por lo que los asistentes pueden acceder escaneando un QR o entrando desde un link, sin descargar nada.' } },
    { '@type': 'Question', name: '¿Qué tipo de eventos pueden usar Nubapay?', acceptedAnswer: { '@type': 'Answer', text: 'Puede usarse en boliches, festivales, fiestas, recitales, eventos privados, ferias, estadios o cualquier evento con venta de productos y puntos de retiro.' } },
    { '@type': 'Question', name: '¿El QR se puede usar más de una vez?', acceptedAnswer: { '@type': 'Answer', text: 'No. Cada QR es único y cuenta con validación antifraude para evitar que un mismo pedido sea retirado más de una vez.' } },
    { '@type': 'Question', name: '¿Puedo tener varios puntos de retiro?', acceptedAnswer: { '@type': 'Answer', text: 'Sí. Podés configurar diferentes barras o sectores y asignar productos específicos a cada punto.' } },
    { '@type': 'Question', name: '¿Cuánto cuesta usar Nubapay?', acceptedAnswer: { '@type': 'Answer', text: 'El modelo puede adaptarse al tipo de evento. Una opción es cobrar una comisión por transacción sobre cada venta realizada dentro de la plataforma. Sin costos fijos.' } },
    { '@type': 'Question', name: '¿Cuánto tarda en configurarse Nubapay para un evento?', acceptedAnswer: { '@type': 'Answer', text: 'Podés tener el menú, los puntos de retiro y los pagos listos en menos de 20 minutos. No necesitás hardware especial ni conocimientos técnicos.' } },
  ],
})

export default async function LandingRootPage() {
  const theme = await fetchTenantThemeForRequest()
  if (theme.dedicated_partner_host) {
    redirect('/login')
  }
  const faqLdHtml = { __html: FAQ_JSONLD }
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={faqLdHtml} />
      <LandingPage />
    </>
  )
}
