import type { Metadata } from 'next'

import { RegretDetailView } from '@/components/organizer/RegretDetailView'
import { organizerEventSectionMeta } from '@/lib/seo'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ eventId: string; regretId: string }>
}): Promise<Metadata> {
  await params
  return organizerEventSectionMeta(
    'Arrepentimiento',
    'Detalle de la solicitud de arrepentimiento y pedidos asociados.',
  )
}

export default async function EventRegretDetailPage({
  params,
}: {
  params: Promise<{ eventId: string; regretId: string }>
}) {
  const { eventId, regretId } = await params
  return (
    <main className="p-4 pt-10 md:p-6 md:pl-[35px] md:pt-[64px]">
      <RegretDetailView eventId={eventId} regretId={regretId} />
    </main>
  )
}
