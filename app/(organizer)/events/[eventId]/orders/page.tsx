import type { Metadata } from 'next'

import { OrdersView } from '@/components/organizer/OrdersView'
import { organizerEventSectionMeta } from '@/lib/seo'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ eventId: string }>
}): Promise<Metadata> {
  await params
  return organizerEventSectionMeta(
    'Pedidos',
    'Lista de pedidos, estados de preparación y entrega para tu evento.',
  )
}

export default async function EventOrdersPage({
  params,
}: {
  params: Promise<{ eventId: string }>
}) {
  const { eventId } = await params
  return (
    <main className="p-4 pt-6 md:p-6 md:pl-[35px] md:pt-[64px]">
      <OrdersView eventId={eventId} />
    </main>
  )
}
