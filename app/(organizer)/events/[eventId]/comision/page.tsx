import type { Metadata } from 'next'

import { CommissionView } from '@/components/organizer/CommissionView'
import { organizerEventSectionMeta } from '@/lib/seo'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ eventId: string }>
}): Promise<Metadata> {
  await params
  return organizerEventSectionMeta(
    'Comisión',
    'Resumen de comisiones del 1% sobre transacciones aprobadas.',
  )
}

export default async function EventComisionPage({
  params,
}: {
  params: Promise<{ eventId: string }>
}) {
  const { eventId } = await params
  return (
    <main className="p-4 pt-6 md:p-6 md:pl-[35px] md:pt-[64px]">
      <CommissionView eventId={eventId} />
    </main>
  )
}
