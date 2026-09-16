import type { Metadata } from 'next'

import { CobrosView } from '@/components/organizer/CobrosView'
import { organizerEventSectionMeta } from '@/lib/seo'

export async function generateMetadata(): Promise<Metadata> {
  return organizerEventSectionMeta(
    'Cobros',
    'Pagos, métodos de pago y comisiones de tu evento.',
  )
}

export default function EventCobrosPage() {
  return (
    <main className="p-4 pt-10 md:p-6 md:pl-[35px] md:pt-[64px]">
      <CobrosView />
    </main>
  )
}
