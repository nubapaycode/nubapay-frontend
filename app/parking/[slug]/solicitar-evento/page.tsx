import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { EventRequestForm, EventRequestPaused } from '@/components/buyer/EventRequestForm'
import { fetchTenantThemeForRequest } from '@/lib/fetchTenantTheme'
import { fetchEventRequestInfo } from '@/lib/publicEventRequest'
import { BUYER_PRIVATE_ROBOTS, pageMeta } from '@/lib/seo'
import { augmentMetadataWithTenant } from '@/lib/tenantMeta'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const [theme, info] = await Promise.all([fetchTenantThemeForRequest(), fetchEventRequestInfo(slug)])
  const title = info ? `Informá tu evento · ${info.parking.name}` : 'Informá tu evento'
  return augmentMetadataWithTenant(
    pageMeta({
      title,
      description: 'Enviá los datos de tu evento para que el estacionamiento los revise.',
      robots: BUYER_PRIVATE_ROBOTS,
    }),
    theme,
    title,
  )
}

/** Formulario público: el organizador pide su evento al dueño del estacionamiento. */
export default async function ParkingEventRequestPage({ params }: Props) {
  const { slug } = await params
  const info = await fetchEventRequestInfo(slug)
  if (!info) notFound()
  return (
    <main className="min-h-screen bg-[#F6F6F8]">
      {info.accepting === false ? (
        <EventRequestPaused parkingName={info.parking.name} />
      ) : (
        <EventRequestForm parkingSlug={info.parking.slug} parkingName={info.parking.name} />
      )}
    </main>
  )
}
