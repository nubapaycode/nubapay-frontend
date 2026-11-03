import type { Metadata } from 'next'

import { RegretsView } from '@/components/organizer/RegretsView'
import { organizerEventSectionMeta } from '@/lib/seo'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ eventId: string }>
}): Promise<Metadata> {
  await params
  return organizerEventSectionMeta(
    'Arrepentimientos',
    'Solicitudes de arrepentimiento de compra del evento y cancelación de QR.',
  )
}

export default async function EventRegretsPage({
  params,
}: {
  params: Promise<{ eventId: string }>
}) {
  const { eventId } = await params
  return (
    <main className="p-4 pt-10 md:p-6 md:pl-[35px] md:pt-[64px]">
      <RegretsView eventId={eventId} />
    </main>
  )
}
