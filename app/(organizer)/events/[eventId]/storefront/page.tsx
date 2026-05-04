import type { Metadata } from 'next'

import { StorefrontSettingsView } from '@/components/organizer/StorefrontSettingsView'
import { organizerEventSectionMeta } from '@/lib/seo'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ eventId: string }>
}): Promise<Metadata> {
  await params
  return organizerEventSectionMeta(
    'Link del catálogo',
    'URL pública del menú, slug y portada almacenada en Supabase.',
  )
}

export default async function EventStorefrontPage({
  params,
}: {
  params: Promise<{ eventId: string }>
}) {
  const { eventId } = await params
  return (
    <main className="p-4 pt-6 md:p-6 md:pl-[35px] md:pt-[64px]">
      <StorefrontSettingsView eventId={eventId} />
    </main>
  )
}
