import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { TicketCheckoutView } from '@/components/buyer/TicketCheckoutView'
import { fetchTenantThemeForRequest } from '@/lib/fetchTenantTheme'
import { hasModule } from '@/lib/modules'
import { PURCHASE_COPY } from '@/lib/purchaseKind'
import { fetchPublicStorefront, mapStorefrontToEvent } from '@/lib/publicCatalog'
import { BUYER_PRIVATE_ROBOTS, pageMeta } from '@/lib/seo'
import { augmentMetadataWithTenant } from '@/lib/tenantMeta'

type Props = { params: Promise<{ slug: string }> }

const copy = PURCHASE_COPY.parking

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const [theme, data] = await Promise.all([fetchTenantThemeForRequest(), fetchPublicStorefront(slug)])
  const title = data ? `${copy.metaCheckoutTitle} · ${data.event.name}` : copy.metaCheckoutTitle
  return augmentMetadataWithTenant(
    pageMeta({ title, description: copy.metaCheckoutDescription, robots: BUYER_PRIVATE_ROBOTS }),
    theme,
    title,
  )
}

/** Checkout de parking: resumen, tiempo para pagar, datos del comprador y pago. */
export default async function ParkingCheckoutPage({ params }: Props) {
  const { slug } = await params
  const data = await fetchPublicStorefront(slug)
  if (!data || !hasModule(data.modules, 'parking')) notFound()

  return (
    <main className="min-h-screen bg-[#F4F4F6]">
      <TicketCheckoutView
        event={mapStorefrontToEvent(data)}
        catalogSlug={slug}
        availablePaymentMethods={data.available_payment_methods ?? ['mp']}
        kind="parking"
      />
    </main>
  )
}
