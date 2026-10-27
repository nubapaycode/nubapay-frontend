import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { notFound, redirect } from 'next/navigation'

import { TicketsStoreView } from '@/components/buyer/TicketsStoreView'
import { fetchTenantThemeForRequest } from '@/lib/fetchTenantTheme'
import { fetchPublicStorefront, mapStorefrontToEvent } from '@/lib/publicCatalog'
import { BUYER_PRIVATE_ROBOTS, SITE_URL, pageMeta, withCoverImage } from '@/lib/seo'
import { augmentMetadataWithTenant } from '@/lib/tenantMeta'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const [theme, data] = await Promise.all([fetchTenantThemeForRequest(), fetchPublicStorefront(slug)])
  const title = data ? `Tickets · ${data.event.name}` : 'Tickets'
  const base = pageMeta({
    title,
    description: data ? `Comprá entradas y tickets de ${data.event.name}.` : 'Este enlace no está disponible.',
    robots: BUYER_PRIVATE_ROBOTS,
  })
  return augmentMetadataWithTenant(withCoverImage(base, data?.event.coverImageUrl), theme, title)
}

/** Tienda de tickets (entradas, parking…) de un evento: página aparte del catálogo. */
export default async function TicketsSlugPage({ params }: Props) {
  const { slug } = await params
  const data = await fetchPublicStorefront(slug)
  if (!data) notFound()

  // Igual que el catálogo: si se entra por el dominio equivocado, ir al subdominio canónico.
  const canonicalSub = data.event_canonical_subdomain
  if (canonicalSub) {
    const h = await headers()
    const currentHost = (h.get('x-forwarded-host') ?? h.get('host') ?? '').split(':')[0]
    const apexUrl = new URL(SITE_URL)
    const expectedHost = `${canonicalSub}.${apexUrl.hostname}`
    if (currentHost !== expectedHost) {
      redirect(`${apexUrl.protocol}//${expectedHost}/tickets/${slug}`)
    }
  }

  const event = mapStorefrontToEvent(data)

  return (
    <main className="min-h-screen bg-[#F4F4F6] pb-32">
      <TicketsStoreView event={event} catalogSlug={slug} />
    </main>
  )
}
