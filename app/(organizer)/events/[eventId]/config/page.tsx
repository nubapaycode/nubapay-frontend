import type { Metadata } from 'next'

import { ConfigView } from '@/components/organizer/ConfigView'
import { organizerEventSectionMeta } from '@/lib/seo'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ eventId: string }>
}): Promise<Metadata> {
  await params
  return organizerEventSectionMeta(
    'Configuración',
    'Configurá el Access Token de Mercado Pago y otros ajustes del evento.',
  )
}

export default async function EventConfigPage({
  params,
}: {
  params: Promise<{ eventId: string }>
}) {
  const { eventId } = await params
  return (
    <main className="p-4 pt-6 md:p-6 md:pl-[35px] md:pt-[64px]">
      <ConfigView eventId={eventId} />
    </main>
  )
}
