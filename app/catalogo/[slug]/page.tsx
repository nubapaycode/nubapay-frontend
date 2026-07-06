import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { notFound, redirect } from 'next/navigation'

import { CatalogView } from '@/components/buyer/CatalogView'
import { fetchTenantThemeForRequest } from '@/lib/fetchTenantTheme'
import { fetchPublicStorefront, mapStorefrontToEvent } from '@/lib/publicCatalog'
import { SITE_URL, pageMeta } from '@/lib/seo'
import { augmentMetadataWithTenant } from '@/lib/tenantMeta'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const [theme, data] = await Promise.all([fetchTenantThemeForRequest(), fetchPublicStorefront(slug)])
  if (!data) {
    return augmentMetadataWithTenant(
      pageMeta({
        title: 'Catálogo',
        description: 'Este enlace no está disponible.',
      }),
      theme,
      'Catálogo',
    )
  }
  const title = data.event.name
  const d = (data.event.description ?? '').trim()
  const description = d.length > 0 ? d.slice(0, 160) : `Menú y pedidos: ${data.event.name}`
  const base = pageMeta({ title, description })
  const cover = data.event.coverImageUrl
  if (!cover) {
    return augmentMetadataWithTenant(base, theme, title)
  }
  const enriched: Metadata = {
    ...base,
    openGraph: {
      ...base.openGraph,
      images: [{ url: cover }],
    },
    twitter: {
      ...base.twitter,
      images: [cover],
    },
  }
  return augmentMetadataWithTenant(enriched, theme, title)
}

/** Catálogo público por slug: portada + productos/combos activos (API). */
export default async function CatalogoSlugPage({ params }: Props) {
  const { slug } = await params
  const data = await fetchPublicStorefront(slug)
  if (!data) notFound()

  // Si el evento pertenece a un tenant con subdominio propio y se accede desde
  // el dominio incorrecto, redirigir al subdominio canónico del evento.
  const canonicalSub = data.event_canonical_subdomain
  if (canonicalSub) {
    const h = await headers()
    const currentHost = (h.get('x-forwarded-host') ?? h.get('host') ?? '').split(':')[0]
    const apexUrl = new URL(SITE_URL)
    const apexHost = apexUrl.hostname
    const expectedHost = `${canonicalSub}.${apexHost}`
    if (currentHost !== expectedHost) {
      redirect(`${apexUrl.protocol}//${expectedHost}/catalogo/${slug}`)
    }
  }

  const event = mapStorefrontToEvent(data)

  return (
    <main className="min-h-screen bg-white pb-32">
      <CatalogView event={event} catalogSlug={slug} />
    </main>
  )
}
