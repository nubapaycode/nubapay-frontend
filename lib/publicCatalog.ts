import { cache } from 'react'

import { catalogPaths } from '@/lib/api'
import { brandedRequestHeaders } from '@/lib/server/brandedRequestHeaders'
import { resolveInternalFetchUrl } from '@/lib/server/resolveInternalFetchUrl'
import type { CatalogBlock, Combo, Event, Product, ServiceFeePercent, Ticket } from '@/types'
import type { TenantThemePayload } from '@/lib/types/tenantTheme'

export type StorefrontApiResponse = {
  event: {
    id: string
    name: string
    description: string
    coverImageUrl: string | null
    startsAt: string | null
    venue: string
    showCategoryShortcuts?: boolean
  }
  products: Product[]
  combos: Combo[]
  blocks?: CatalogBlock[]
  tickets?: Ticket[]
  parking?: Ticket[]
  parking_maps_url?: string | null
  /** Módulos que ofrece el evento. */
  modules?: string[]
  /** Costo de servicio (%) que el backend suma al total: 5% tickets, 2% productos. */
  service_fee_percent?: ServiceFeePercent
  categories?: string[]
  theme?: TenantThemePayload
  /** Subdominio del tenant al que pertenece el evento (distinto del host actual). Presente solo cuando el acceso viene desde el dominio incorrecto. */
  event_canonical_subdomain?: string | null
  /** Switch global de plataforma: si es false, el comprador no puede agregar al carrito ni pagar. */
  payments_enabled?: boolean
  /** Cierre de compra del organizador (X horas antes del inicio). Distinto del switch global. */
  purchase_closed?: boolean
  purchase_closes_at?: string | null
  /** Métodos de pago online realmente configurados para este evento (ej. ['mp', 'sipago']). */
  available_payment_methods?: string[]
}

/** Se puede comprar si la plataforma lo permite y el organizador no cerró la compra. */
export function storefrontCanBuy(data: Pick<StorefrontApiResponse, 'payments_enabled' | 'purchase_closed'>): boolean {
  return (data.payments_enabled ?? true) && !data.purchase_closed
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
    blocks: data.blocks ?? [],
    tickets: data.tickets ?? [],
    parking: data.parking ?? [],
    parkingMapsUrl: data.parking_maps_url ?? null,
    modules: data.modules,
    serviceFeePercent: data.service_fee_percent,
    categories: data.categories ?? [],
    showCategoryShortcuts: event.showCategoryShortcuts ?? false,
    paymentsEnabled: storefrontCanBuy(data),
    purchaseClosed: data.purchase_closed ?? false,
  }
}

export const fetchPublicStorefront = cache(async (slug: string): Promise<StorefrontApiResponse | null> => {
  let url = catalogPaths.storefrontBySlug(slug)
  url = await resolveInternalFetchUrl(url)
  const extra = await brandedRequestHeaders()
  const res = await fetch(url, { next: { revalidate: 30 }, headers: extra })
  if (!res.ok) return null
  return res.json() as Promise<StorefrontApiResponse>
})
