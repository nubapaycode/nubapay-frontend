import type { Metadata } from 'next'

import { OrderTracker } from '@/components/buyer/OrderTracker'
import { BUYER_PRIVATE_ROBOTS, pageMeta } from '@/lib/seo'

interface OrderPageProps {
  params: Promise<{ eventId: string; orderId: string }>
}

export async function generateMetadata(): Promise<Metadata> {
  return pageMeta({
    title: 'Estado del pedido',
    description: 'Seguí el estado de tu compra y los detalles de tu pedido con Nubapay.',
    robots: BUYER_PRIVATE_ROBOTS,
  })
}

export default async function OrderPage({ params }: OrderPageProps) {
  const { eventId, orderId } = await params
  return (
    <main className="min-h-screen bg-white">
      <OrderTracker orderId={orderId} eventId={eventId} />
    </main>
  )
}
