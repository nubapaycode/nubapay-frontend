import type { Metadata } from 'next'

import { OrganizerBackLink } from '@/components/organizer/OrganizerBackLink'
import { PartnerBrandView } from '@/components/organizer/PartnerBrandView'
import { ORGANIZER_ROBOTS } from '@/lib/seo'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ eventId: string }>
}): Promise<Metadata> {
  await params
  return {
    title: 'Marca y dominios',
    description: 'Configuración de marca blanca y DNS para tu tenant.',
    robots: ORGANIZER_ROBOTS,
  }
}

export default async function OrganizerBrandPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params
  return (
    <main className="p-4 pt-10 md:p-6 md:pl-[35px] md:pt-[64px]">
      {/* Se entra desde Cuenta */}
      <div className="max-w-3xl mx-auto px-4">
        <OrganizerBackLink href={`/events/${eventId}/cuenta`} label="Volver a Cuenta" />
      </div>
      <PartnerBrandView />
    </main>
  )
}
