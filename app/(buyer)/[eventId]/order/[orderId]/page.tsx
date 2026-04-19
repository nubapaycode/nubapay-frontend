import type { Metadata } from 'next'
import { OrderTracker } from '@/components/buyer/OrderTracker'

interface OrderPageProps {
  params: Promise<{ eventId: string; orderId: string }>
}

export const metadata: Metadata = {
  title: 'Seguimiento — Nubapay',
}

export default async function OrderPage({ params }: OrderPageProps) {
  const { eventId, orderId } = await params
  return (
    <main className="min-h-screen bg-white">
      <OrderTracker orderId={orderId} eventId={eventId} />
    </main>
  )
}
