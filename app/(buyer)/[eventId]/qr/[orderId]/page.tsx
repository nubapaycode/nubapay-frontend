import type { Metadata } from 'next'
import { QRDisplay } from '@/components/buyer/QRDisplay'

interface QRPageProps {
  params: Promise<{ eventId: string; orderId: string }>
}

export const metadata: Metadata = {
  title: 'QR de retiro — Nubapay',
}

export default async function QRPage({ params }: QRPageProps) {
  const { orderId } = await params
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4">
      <QRDisplay orderId={orderId} />
    </main>
  )
}
