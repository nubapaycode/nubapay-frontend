import type { Metadata } from 'next'
import { OrdersView } from '@/components/organizer/OrdersView'

export const metadata: Metadata = {
  title: 'Pedidos — Nubapay',
}

export default function OrganizerOrdersPage() {
  return (
    <main className="min-h-screen p-6">
      <OrdersView />
    </main>
  )
}
