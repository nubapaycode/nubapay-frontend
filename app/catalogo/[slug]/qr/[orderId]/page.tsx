import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { QRDisplay } from '@/components/buyer/QRDisplay'
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
      title: `QR de retiro${suffix}`,
      description: 'Mostrá este código QR en el punto de retiro para validar y entregar tu pedido.',
      robots: BUYER_PRIVATE_ROBOTS,
    }),
    theme,
    `QR de retiro${suffix}`,
  )
}

export default async function CatalogoQrPage({ params }: Props) {
  const { slug, orderId } = await params
  const data = await fetchPublicStorefront(slug)
  if (!data) notFound()
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-white">
      <QRDisplay orderId={orderId} eventId={data.event.id} catalogSlug={slug} />
    </main>
  )
}
