import type { Metadata } from 'next'

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
  await params
  return (
    <main className="p-4 pt-6 md:p-6 md:pl-[35px] md:pt-[64px]">
      <PartnerBrandView />
    </main>
  )
}
