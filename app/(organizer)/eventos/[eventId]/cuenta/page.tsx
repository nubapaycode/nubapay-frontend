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
    'Tu sesión activa.',
  )
}

export default async function EventCuentaPage() {
  return (
    <main className="p-4 pt-10 md:p-6 md:pl-[35px] md:pt-[64px]">
      <CuentaView />
    </main>
  )
}
