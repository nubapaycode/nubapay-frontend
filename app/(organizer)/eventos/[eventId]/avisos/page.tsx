import type { Metadata } from 'next'

import { AnnouncementsView } from '@/components/organizer/AnnouncementsView'
import { organizerEventSectionMeta } from '@/lib/seo'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ eventId: string }>
}): Promise<Metadata> {
  await params
  return organizerEventSectionMeta('Avisos', 'Enviá e-mails a los compradores del evento.')
}

export default async function EventAnnouncementsPage({
  params,
}: {
  params: Promise<{ eventId: string }>
}) {
  const { eventId } = await params
  return (
    <main className="p-4 pt-10 md:p-6 md:px-8 md:pt-[64px] min-w-0">
      <AnnouncementsView eventId={eventId} />
    </main>
  )
}
