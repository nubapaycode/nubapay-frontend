import type { Metadata } from 'next'

import { PaymentMethodsView } from '@/components/organizer/PaymentMethodsView'
import { organizerEventSectionMeta } from '@/lib/seo'

export async function generateMetadata(): Promise<Metadata> {
  return organizerEventSectionMeta(
    'Métodos de pago',
    'Conectá las pasarelas de pago de este evento.',
  )
}

export default async function PaymentMethodsPage({
  params,
}: {
  params: Promise<{ eventId: string }>
}) {
  const { eventId } = await params
  return (
    <main className="p-4 pt-10 md:p-6 md:pl-[35px] md:pt-[64px]">
      <PaymentMethodsView eventId={eventId} />
    </main>
  )
}
