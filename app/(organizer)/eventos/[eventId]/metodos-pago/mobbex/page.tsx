import type { Metadata } from 'next'

import { MobbexSetupView } from '@/components/organizer/MobbexSetupView'
import { organizerEventSectionMeta } from '@/lib/seo'

export async function generateMetadata(): Promise<Metadata> {
  return organizerEventSectionMeta(
    'Mobbex',
    'Conectá tu cuenta de Mobbex para recibir pagos.',
  )
}

export default async function MobbexSetupPage({
  params,
}: {
  params: Promise<{ eventId: string }>
}) {
  const { eventId } = await params
  return (
    <main className="p-4 pt-10 md:p-6 md:pl-[35px] md:pt-[64px]">
      <MobbexSetupView eventId={eventId} />
    </main>
  )
}
