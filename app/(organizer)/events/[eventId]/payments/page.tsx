import type { Metadata } from 'next'

import { PaymentsView } from '@/components/organizer/PaymentsView'
import { organizerEventSectionMeta } from '@/lib/seo'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ eventId: string }>
}): Promise<Metadata> {
  await params
  return organizerEventSectionMeta(
    'Pagos',
    'Cobros registrados por canal de pago vinculados a tu evento.',
  )
}

export default async function EventPaymentsPage({
  params,
}: {
  params: Promise<{ eventId: string }>
}) {
  const { eventId } = await params
  return (
    <main className="p-4 pt-6 md:p-6 md:pl-[35px] md:pt-[64px]">
      <PaymentsView eventId={eventId} />
    </main>
  )
}
