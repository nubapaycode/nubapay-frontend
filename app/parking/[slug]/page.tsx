import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { notFound, redirect } from 'next/navigation'

import { TicketsStoreView } from '@/components/buyer/TicketsStoreView'
import { fetchTenantThemeForRequest } from '@/lib/fetchTenantTheme'
import { hasModule } from '@/lib/modules'
import { PURCHASE_COPY } from '@/lib/purchaseKind'
import { fetchPublicStorefront, mapStorefrontToEvent } from '@/lib/publicCatalog'
import { BUYER_PRIVATE_ROBOTS, SITE_URL, pageMeta, withCoverImage } from '@/lib/seo'
import { augmentMetadataWithTenant } from '@/lib/tenantMeta'

type Props = { params: Promise<{ slug: string }> }

const copy = PURCHASE_COPY.parking

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const [theme, data] = await Promise.all([fetchTenantThemeForRequest(), fetchPublicStorefront(slug)])
  const available = data && hasModule(data.modules, 'parking')
  const title = available ? `${copy.metaTitle} · ${data.event.name}` : copy.metaTitle
  const base = pageMeta({
    title,
    description: available ? `${copy.metaDescription} ${data.event.name}.` : 'Este enlace no está disponible.',
    robots: BUYER_PRIVATE_ROBOTS,
  })
  return augmentMetadataWithTenant(withCoverImage(base, data?.event.coverImageUrl), theme, title)
}

/** Venta de parking de un evento: página aparte del catálogo y de los tickets. */
export default async function ParkingSlugPage({ params }: Props) {
  const { slug } = await params
  const data = await fetchPublicStorefront(slug)
  // El módulo lo habilita el admin de plataforma al dueño del evento.
  if (!data || !hasModule(data.modules, 'parking')) notFound()

  // Igual que el catálogo: si se entra por el dominio equivocado, ir al subdominio canónico.
  const canonicalSub = data.event_canonical_subdomain
  if (canonicalSub) {
    const h = await headers()
    const currentHost = (h.get('x-forwarded-host') ?? h.get('host') ?? '').split(':')[0]
    const apexUrl = new URL(SITE_URL)
    const expectedHost = `${canonicalSub}.${apexUrl.hostname}`
    if (currentHost !== expectedHost) {
      redirect(`${apexUrl.protocol}//${expectedHost}/parking/${slug}`)
    }
  }

  return (
    <main className="min-h-screen bg-[#F4F4F6] pb-32">
      <TicketsStoreView event={mapStorefrontToEvent(data)} catalogSlug={slug} kind="parking" />
    </main>
  )
}
