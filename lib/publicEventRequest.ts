import { cache } from 'react'

import { eventRequestPaths } from '@/lib/api'
import { brandedRequestHeaders } from '@/lib/server/brandedRequestHeaders'
import { resolveInternalFetchUrl } from '@/lib/server/resolveInternalFetchUrl'

export type EventRequestInfo = { parking: { name: string; slug: string } }

/** Datos públicos del estacionamiento; null si no existe o pausó las solicitudes. */
export const fetchEventRequestInfo = cache(async (slug: string): Promise<EventRequestInfo | null> => {
  const url = await resolveInternalFetchUrl(eventRequestPaths.form(slug))
  const extra = await brandedRequestHeaders()
  const res = await fetch(url, { next: { revalidate: 30 }, headers: extra })
  if (!res.ok) return null
  return res.json() as Promise<EventRequestInfo>
})
