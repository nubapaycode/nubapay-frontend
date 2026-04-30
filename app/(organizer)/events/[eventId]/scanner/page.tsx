import type { Metadata } from 'next'

import { ScannerView } from '@/components/organizer/ScannerView'
import { organizerEventSectionMeta } from '@/lib/seo'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ eventId: string }>
}): Promise<Metadata> {
  await params
  return organizerEventSectionMeta(
    'Escáner QR',
    'Escaneá el código QR del comprador para validar el pedido y registrar la entrega.',
  )
}

export default async function EventScannerPage({
  params,
}: {
  params: Promise<{ eventId: string }>
}) {
  const { eventId } = await params
  return (
    <main className="p-4 pt-6 md:p-6 md:px-8 md:pt-[64px] md:flex md:justify-center md:items-start min-w-0">
      <ScannerView eventId={eventId} />
    </main>
  )
}
