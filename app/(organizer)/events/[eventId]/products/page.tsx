import type { Metadata } from 'next'

import { ProductsView } from '@/components/organizer/ProductsView'
import { organizerEventSectionMeta } from '@/lib/seo'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ eventId: string }>
}): Promise<Metadata> {
  await params
  return organizerEventSectionMeta(
    'Catálogo',
    'Gestioná productos, combos, categorías y disponibilidad del menú.',
  )
}

export default async function EventProductsPage({
  params,
}: {
  params: Promise<{ eventId: string }>
}) {
  const { eventId } = await params
  return (
    <main className="w-full min-w-0 max-w-none p-4 pt-6 md:p-6 md:pl-[35px] md:pr-8 md:pt-[64px]">
      <ProductsView eventId={eventId} />
    </main>
  )
}
