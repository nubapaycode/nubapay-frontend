import type { Metadata } from 'next'

import { BlocksView } from '@/components/organizer/BlocksView'
import { organizerEventSectionMeta } from '@/lib/seo'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ eventId: string }>
}): Promise<Metadata> {
  await params
  return organizerEventSectionMeta(
    'Bloques personalizados',
    'Armá secciones destacadas del catálogo con banner propio y productos elegidos a mano.',
  )
}

export default async function EventBlocksPage({
  params,
}: {
  params: Promise<{ eventId: string }>
}) {
  const { eventId } = await params
  return (
    <main className="w-full min-w-0 max-w-none p-4 pt-6 md:p-6 md:pl-[35px] md:pr-8 md:pt-[64px]">
      <BlocksView eventId={eventId} />
    </main>
  )
}
