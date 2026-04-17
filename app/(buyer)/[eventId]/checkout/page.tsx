import type { Metadata } from 'next'
import { CheckoutView } from '@/components/buyer/CheckoutView'

interface CheckoutPageProps {
  params: Promise<{ eventId: string }>
}

export const metadata: Metadata = {
  title: 'Confirmar pedido — Nubapay',
}

export default async function CheckoutPage({ params }: CheckoutPageProps) {
  const { eventId } = await params
  return (
    <main className="min-h-screen p-4 pb-24">
      <CheckoutView eventId={eventId} />
    </main>
  )
}
