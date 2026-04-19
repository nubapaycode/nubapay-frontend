import type { Metadata } from 'next'
import { CartView } from '@/components/buyer/CartView'

interface CartPageProps {
  params: Promise<{ eventId: string }>
}

export const metadata: Metadata = {
  title: 'Tu pedido — Nubapay',
}

export default async function CartPage({ params }: CartPageProps) {
  const { eventId } = await params
  return (
    <main className="min-h-screen bg-white">
      <CartView eventId={eventId} />
    </main>
  )
}
