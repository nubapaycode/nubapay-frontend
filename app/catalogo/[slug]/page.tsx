import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { CatalogView } from '@/components/buyer/CatalogView'
import { fetchPublicStorefront, mapStorefrontToEvent } from '@/lib/publicCatalog'
import { pageMeta } from '@/lib/seo'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const data = await fetchPublicStorefront(slug)
  if (!data) {
    return pageMeta({
      title: 'Catálogo',
      description: 'Este enlace no está disponible.',
    })
  }
  const title = data.event.name
  const d = (data.event.description ?? '').trim()
  const description = d.length > 0 ? d.slice(0, 160) : `Menú y pedidos: ${data.event.name}`
  const base = pageMeta({ title, description })
  const cover = data.event.coverImageUrl
  if (!cover) return base
  return {
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
}

/** Catálogo público por slug: portada + productos/combos activos (API). */
export default async function CatalogoSlugPage({ params }: Props) {
  const { slug } = await params
  const data = await fetchPublicStorefront(slug)
  if (!data) notFound()
  const event = mapStorefrontToEvent(data)

  return (
    <main className="min-h-screen pb-32">
      <CatalogView event={event} catalogSlug={slug} />
    </main>
  )
}
