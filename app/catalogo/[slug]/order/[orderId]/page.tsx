import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { OrderTracker } from '@/components/buyer/OrderTracker'
import { fetchTenantThemeForRequest } from '@/lib/fetchTenantTheme'
import { fetchPublicStorefront } from '@/lib/publicCatalog'
import { BUYER_PRIVATE_ROBOTS, pageMeta } from '@/lib/seo'
import { augmentMetadataWithTenant } from '@/lib/tenantMeta'

interface Props {
  params: Promise<{ slug: string; orderId: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const [theme, data] = await Promise.all([fetchTenantThemeForRequest(), fetchPublicStorefront(slug)])
  const suffix = data ? ` · ${data.event.name}` : ''
  return augmentMetadataWithTenant(
    pageMeta({
      title: `Estado del pedido${suffix}`,
      description: 'Seguí el estado de tu compra y los detalles de tu pedido con Nubapay.',
      robots: BUYER_PRIVATE_ROBOTS,
    }),
    theme,
    `Estado del pedido${suffix}`,
  )
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
