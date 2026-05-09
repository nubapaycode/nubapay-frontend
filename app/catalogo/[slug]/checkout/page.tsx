import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { CheckoutView } from '@/components/buyer/CheckoutView'
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
      title: `Confirmar pedido${suffix}`,
      description: 'Completá los datos y elegí método de pago para finalizar tu compra con Nubapay.',
      robots: BUYER_PRIVATE_ROBOTS,
    }),
    theme,
    `Confirmar pedido${suffix}`,
  )
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
