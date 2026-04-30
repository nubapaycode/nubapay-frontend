import type { Metadata } from 'next'

import { CheckoutView } from '@/components/buyer/CheckoutView'
import { BUYER_PRIVATE_ROBOTS, pageMeta } from '@/lib/seo'

interface CheckoutPageProps {
  params: Promise<{ eventId: string }>
}

export async function generateMetadata(): Promise<Metadata> {
  return pageMeta({
    title: 'Confirmar pedido',
    description: 'Completá los datos y elegí método de pago para finalizar tu compra con Nubapay.',
    robots: BUYER_PRIVATE_ROBOTS,
  })
}

export default async function CheckoutPage({ params }: CheckoutPageProps) {
  const { eventId } = await params
  return (
    <main className="min-h-screen bg-white">
      <CheckoutView eventId={eventId} />
    </main>
  )
}
