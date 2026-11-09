import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { RegretFormView } from '@/components/buyer/RegretFormView'
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
      title: `Botón de arrepentimiento${suffix}`,
      description: 'Solicitá el arrepentimiento de tu compra.',
      robots: BUYER_PRIVATE_ROBOTS,
    }),
    theme,
    `Botón de arrepentimiento${suffix}`,
  )
}

export default async function CatalogoRegretPage({ params }: Props) {
  const { slug } = await params
  const data = await fetchPublicStorefront(slug)
  if (!data) notFound()
  return (
    <main className="min-h-screen bg-white">
      <RegretFormView catalogSlug={slug} eventName={data.event.name} />
    </main>
  )
}
