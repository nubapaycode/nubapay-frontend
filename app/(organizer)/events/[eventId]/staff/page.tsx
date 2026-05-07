import type { Metadata } from 'next'

import { StaffView } from '@/components/organizer/StaffView'
import { organizerEventSectionMeta } from '@/lib/seo'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ eventId: string }>
}): Promise<Metadata> {
  await params
  return organizerEventSectionMeta('Equipo', 'Invitá integrantes y asigná permisos por herramienta.')
}

export default async function EventStaffPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params
  return (
    <main className="p-4 pt-6 md:p-6 md:px-8 md:pt-[64px] min-w-0">
      <StaffView eventId={eventId} />
    </main>
  )
}
