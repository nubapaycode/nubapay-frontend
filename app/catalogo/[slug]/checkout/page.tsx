import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { CheckoutView } from '@/components/buyer/CheckoutView'
import { fetchPublicStorefront } from '@/lib/publicCatalog'
import { BUYER_PRIVATE_ROBOTS, pageMeta } from '@/lib/seo'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata(): Promise<Metadata> {
  return pageMeta({
    title: 'Confirmar pedido',
    description: 'Completá los datos y elegí método de pago para finalizar tu compra con Nubapay.',
    robots: BUYER_PRIVATE_ROBOTS,
  })
}

export default async function CatalogoCheckoutPage({ params }: Props) {
  const { slug } = await params
  const data = await fetchPublicStorefront(slug)
  if (!data) notFound()
  return (
    <main className="min-h-screen bg-white">
      <CheckoutView eventId={data.event.id} catalogSlug={slug} />
    </main>
  )
}
