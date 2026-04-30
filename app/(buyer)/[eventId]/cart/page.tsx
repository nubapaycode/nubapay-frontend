import type { Metadata } from 'next'

import { CartView } from '@/components/buyer/CartView'
import { BUYER_PRIVATE_ROBOTS, pageMeta } from '@/lib/seo'

interface CartPageProps {
  params: Promise<{ eventId: string }>
}

export async function generateMetadata(): Promise<Metadata> {
  return pageMeta({
    title: 'Tu carrito',
    description: 'Revisá productos y cantidades antes de confirmar el pago con Nubapay.',
    robots: BUYER_PRIVATE_ROBOTS,
  })
}

export default async function CartPage({ params }: CartPageProps) {
  const { eventId } = await params
  return (
    <main className="min-h-screen bg-white">
      <CartView eventId={eventId} />
    </main>
  )
}
