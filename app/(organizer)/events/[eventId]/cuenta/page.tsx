import type { Metadata } from 'next'

import { CuentaView } from '@/components/organizer/CuentaView'
import { organizerEventSectionMeta } from '@/lib/seo'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ eventId: string }>
}): Promise<Metadata> {
  await params
  return organizerEventSectionMeta(
    'Cuenta',
    'Gestioná tu cuenta y método de cobro del evento.',
  )
}

export default async function EventCuentaPage({
  params,
}: {
  params: Promise<{ eventId: string }>
}) {
  const { eventId } = await params
  return (
    <main className="p-4 pt-6 md:p-6 md:pl-[35px] md:pt-[64px]">
      <CuentaView eventId={eventId} />
    </main>
  )
}
