import type { Metadata } from 'next'

import { DashboardView } from '@/components/organizer/DashboardView'
import { organizerEventSectionMeta } from '@/lib/seo'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ eventId: string }>
}): Promise<Metadata> {
  await params
  return organizerEventSectionMeta(
    'Panel',
    'Resumen de ventas, pedidos activos y productos más vendidos de tu evento.',
  )
}

export default async function EventDashboardPage({
  params,
}: {
  params: Promise<{ eventId: string }>
}) {
  const { eventId } = await params
  return (
    <main className="p-4 pt-6 md:p-6 md:pl-[35px] md:pt-[64px]">
      <DashboardView eventId={eventId} />
    </main>
  )
}
