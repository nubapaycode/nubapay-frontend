import type { Metadata } from 'next'

import { QRDisplay } from '@/components/buyer/QRDisplay'
import { BUYER_PRIVATE_ROBOTS, pageMeta } from '@/lib/seo'

interface QRPageProps {
  params: Promise<{ eventId: string; orderId: string }>
}

export async function generateMetadata(): Promise<Metadata> {
  return pageMeta({
    title: 'QR de retiro',
    description: 'Mostrá este código QR en el punto de retiro para validar y entregar tu pedido.',
    robots: BUYER_PRIVATE_ROBOTS,
  })
}

export default async function QRPage({ params }: QRPageProps) {
  const { eventId, orderId } = await params
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-white">
      <QRDisplay orderId={orderId} eventId={eventId} />
    </main>
  )
}
