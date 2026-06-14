import { eventsPaths } from '@/lib/api'
import { authHeadersJson } from '@/lib/authSession'
import { browserFetch } from '@/lib/browserFetch'
import type { OrganizerEventDetail } from '@/lib/types/organizer'

export async function fetchOrganizerEventDetail(
  eventId: string,
): Promise<{ ok: true; event: OrganizerEventDetail } | { ok: false; error: string }> {
  const res = await browserFetch(eventsPaths.detail(eventId), {
    headers: authHeadersJson(),
  })
  const body = (await res.json()) as { event?: OrganizerEventDetail; error?: string }
  if (!res.ok || !body.event) return { ok: false, error: body.error ?? 'No se pudo cargar el evento' }
  return { ok: true, event: body.event }
}

export async function patchOrganizerEvent(
  eventId: string,
  payload: Partial<{
    name: string
    slug: string
    description: string | null
    cover_image_url: string | null
    starts_at: string | null
    ends_at: string | null
    status: string
    is_active: boolean
    notify_pickup_point: boolean
    /** String para guardar el token; null o "" para eliminarlo. */
    mp_access_token: string | null
  }>,
): Promise<{ ok: true; event: OrganizerEventDetail } | { ok: false; error: string }> {
  const res = await browserFetch(eventsPaths.detail(eventId), {
    method: 'PATCH',
    headers: authHeadersJson(),
    body: JSON.stringify(payload),
  })
  const body = (await res.json()) as { event?: OrganizerEventDetail; error?: string }
  if (!res.ok || !body.event) return { ok: false, error: body.error ?? 'No se pudo guardar' }
  return { ok: true, event: body.event }
}
