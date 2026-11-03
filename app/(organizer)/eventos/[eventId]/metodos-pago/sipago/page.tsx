import type { Metadata } from 'next'

import { SipagoSetupView } from '@/components/organizer/SipagoSetupView'
import { organizerEventSectionMeta } from '@/lib/seo'

export async function generateMetadata(): Promise<Metadata> {
  return organizerEventSectionMeta(
    'Sipago',
    'Conectá tu cuenta de Sipago para recibir pagos.',
  )
}

export default async function SipagoSetupPage({
  params,
}: {
  params: Promise<{ eventId: string }>
}) {
  const { eventId } = await params
  return (
    <main className="p-4 pt-10 md:p-6 md:pl-[35px] md:pt-[64px]">
      <SipagoSetupView eventId={eventId} />
    </main>
  )
}
