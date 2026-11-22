import type { Metadata } from 'next'

import { TicketsView } from '@/components/organizer/TicketsView'
import { organizerEventSectionMeta } from '@/lib/seo'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ eventId: string }>
}): Promise<Metadata> {
  await params
  return organizerEventSectionMeta('Parking', 'Creá y administrá los lugares de estacionamiento de tu evento.')
}

export default async function EventParkingPage({
  params,
}: {
  params: Promise<{ eventId: string }>
}) {
  const { eventId } = await params
  return (
    <main className="w-full min-w-0 max-w-none p-4 pt-10 md:p-6 md:pl-[35px] md:pr-8 md:pt-[64px]">
      <TicketsView eventId={eventId} kind="parking" />
    </main>
  )
}
