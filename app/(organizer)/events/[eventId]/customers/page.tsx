import type { Metadata } from 'next'

import { CustomersView } from '@/components/organizer/CustomersView'
import { organizerEventSectionMeta } from '@/lib/seo'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ eventId: string }>
}): Promise<Metadata> {
  await params
  return organizerEventSectionMeta(
    'Clientes',
    'Contactos y compradores que realizaron pedidos en tu evento.',
  )
}

export default async function EventCustomersPage({
  params,
}: {
  params: Promise<{ eventId: string }>
}) {
  const { eventId } = await params
  return (
    <main className="p-4 pt-6 md:p-6 md:pl-[35px] md:pt-[64px]">
      <CustomersView eventId={eventId} />
    </main>
  )
}
