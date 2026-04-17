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
    <main className="min-h-screen p-4 pb-24">
      <CartView eventId={eventId} />
    </main>
  )
}
