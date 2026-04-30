import type { Metadata } from 'next'

import { PickupPointsView } from '@/components/organizer/PickupPointsView'
import { organizerEventSectionMeta } from '@/lib/seo'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ eventId: string }>
}): Promise<Metadata> {
  await params
  return organizerEventSectionMeta(
    'Puntos de retiro',
    'Definí dónde se retiran pedidos y qué productos se entregan en cada punto.',
  )
}

export default async function EventPickupPointsPage({
  params,
}: {
  params: Promise<{ eventId: string }>
}) {
  const { eventId } = await params
  return (
    <main className="w-full min-w-0 max-w-none p-4 pt-6 md:p-6 md:pl-[35px] md:pr-8 md:pt-[64px]">
      <PickupPointsView eventId={eventId} />
    </main>
  )
}
