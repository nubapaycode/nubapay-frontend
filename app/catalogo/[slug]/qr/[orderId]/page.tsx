import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { QRDisplay } from '@/components/buyer/QRDisplay'
import { fetchPublicStorefront } from '@/lib/publicCatalog'
import { BUYER_PRIVATE_ROBOTS, pageMeta } from '@/lib/seo'

interface Props {
  params: Promise<{ slug: string; orderId: string }>
}

export async function generateMetadata(): Promise<Metadata> {
  return pageMeta({
    title: 'QR de retiro',
    description: 'Mostrá este código QR en el punto de retiro para validar y entregar tu pedido.',
    robots: BUYER_PRIVATE_ROBOTS,
  })
}

export default async function CatalogoQrPage({ params }: Props) {
  const { slug, orderId } = await params
  const data = await fetchPublicStorefront(slug)
  if (!data) notFound()
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-white">
      <QRDisplay orderId={orderId} eventId={data.event.id} catalogSlug={slug} />
    </main>
  )
}
