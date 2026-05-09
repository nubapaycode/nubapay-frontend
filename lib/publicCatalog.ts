import { cache } from 'react'

import { catalogPaths } from '@/lib/api'
import { brandedRequestHeaders } from '@/lib/server/brandedRequestHeaders'
import { resolveInternalFetchUrl } from '@/lib/server/resolveInternalFetchUrl'
import type { Combo, Event, Product } from '@/types'
import type { TenantThemePayload } from '@/lib/types/tenantTheme'

export type StorefrontApiResponse = {
  event: {
    id: string
    name: string
    description: string
    coverImageUrl: string | null
    startsAt: string | null
    venue: string
  }
  products: Product[]
  combos: Combo[]
  theme?: TenantThemePayload
}

export function mapStorefrontToEvent(data: StorefrontApiResponse): Event {
  const { event } = data
  return {
    id: event.id,
    name: event.name,
    description: event.description ?? '',
    date: event.startsAt ?? '',
    venue: event.venue ?? '',
    coverImageUrl: event.coverImageUrl ?? undefined,
    products: data.products ?? [],
    combos: data.combos ?? [],
  }
}

export const fetchPublicStorefront = cache(async (slug: string): Promise<StorefrontApiResponse | null> => {
  let url = catalogPaths.storefrontBySlug(slug)
  url = await resolveInternalFetchUrl(url)
  const extra = await brandedRequestHeaders()
  const res = await fetch(url, { cache: 'no-store', headers: extra })
  if (!res.ok) return null
  return res.json() as Promise<StorefrontApiResponse>
})
