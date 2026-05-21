import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { CartView } from '@/components/buyer/CartView'
import { fetchTenantThemeForRequest } from '@/lib/fetchTenantTheme'
import { fetchPublicStorefront } from '@/lib/publicCatalog'
import { BUYER_PRIVATE_ROBOTS, pageMeta } from '@/lib/seo'
import { augmentMetadataWithTenant } from '@/lib/tenantMeta'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const [theme, data] = await Promise.all([fetchTenantThemeForRequest(), fetchPublicStorefront(slug)])
  const suffix = data ? ` · ${data.event.name}` : ''
  return augmentMetadataWithTenant(
    pageMeta({
      title: `Tu carrito${suffix}`,
      description: 'Revisá productos y cantidades antes de confirmar el pago con Nubapay.',
      robots: BUYER_PRIVATE_ROBOTS,
    }),
    theme,
    `Tu carrito${suffix}`,
  )
}

export default async function CatalogoCartPage({ params }: Props) {
  const { slug } = await params
  const data = await fetchPublicStorefront(slug)
  if (!data) notFound()
  return (
    <main className="min-h-screen bg-white">
      <CartView eventId={data.event.id} catalogSlug={slug} products={data.products} />
    </main>
  )
}
