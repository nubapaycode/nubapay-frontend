import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { OrderTracker } from '@/components/buyer/OrderTracker'
import { fetchPublicStorefront } from '@/lib/publicCatalog'
import { BUYER_PRIVATE_ROBOTS, pageMeta } from '@/lib/seo'

interface Props {
  params: Promise<{ slug: string; orderId: string }>
}

export async function generateMetadata(): Promise<Metadata> {
  return pageMeta({
    title: 'Estado del pedido',
    description: 'Seguí el estado de tu compra y los detalles de tu pedido con Nubapay.',
    robots: BUYER_PRIVATE_ROBOTS,
  })
}

export default async function CatalogoOrderPage({ params }: Props) {
  const { slug, orderId } = await params
  const data = await fetchPublicStorefront(slug)
  if (!data) notFound()
  return (
    <main className="min-h-screen bg-white">
      <OrderTracker orderId={orderId} eventId={data.event.id} catalogSlug={slug} />
    </main>
  )
}
