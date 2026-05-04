import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { CartView } from '@/components/buyer/CartView'
import { fetchPublicStorefront } from '@/lib/publicCatalog'
import { BUYER_PRIVATE_ROBOTS, pageMeta } from '@/lib/seo'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata(): Promise<Metadata> {
  return pageMeta({
    title: 'Tu carrito',
    description: 'Revisá productos y cantidades antes de confirmar el pago con Nubapay.',
    robots: BUYER_PRIVATE_ROBOTS,
  })
}

export default async function CatalogoCartPage({ params }: Props) {
  const { slug } = await params
  const data = await fetchPublicStorefront(slug)
  if (!data) notFound()
  return (
    <main className="min-h-screen bg-white">
      <CartView eventId={data.event.id} catalogSlug={slug} />
    </main>
  )
}
