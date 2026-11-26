import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { PickupPointsView } from '@/components/organizer/PickupPointsView'
import { PICKUP_POINTS_ENABLED } from '@/lib/features'
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
  // Herramienta apagada (lib/features.ts): un link viejo o un favorito vuelve al panel del evento.
  if (!PICKUP_POINTS_ENABLED) redirect(`/eventos/${eventId}/resumen`)
  return (
    <main className="w-full min-w-0 max-w-none p-4 pt-10 md:p-6 md:pl-[35px] md:pr-8 md:pt-[64px]">
      <PickupPointsView eventId={eventId} />
    </main>
  )
}
