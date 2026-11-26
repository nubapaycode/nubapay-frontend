import type { Metadata } from 'next'

import { EventCourtesies } from '@/components/organizer/EventCourtesies'
import { organizerEventSectionMeta } from '@/lib/seo'

export async function generateMetadata(): Promise<Metadata> {
  return organizerEventSectionMeta('Cortesías', 'Entradas o lugares de parking sin cargo, a nombre de alguien.')
}

export default async function EventCourtesiesPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params
  return (
    <main className="w-full min-w-0 max-w-none p-4 pt-10 md:p-6 md:pl-[35px] md:pr-8 md:pt-[64px]">
      <EventCourtesies eventId={eventId} />
    </main>
  )
}
