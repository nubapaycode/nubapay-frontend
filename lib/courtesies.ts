import { authHeadersJson } from '@/lib/authSession'
import { eventsPaths } from '@/lib/api'
import { browserFetch } from '@/lib/browserFetch'

export type CourtesyKind = 'parking' | 'ticket'

export type Courtesy = {
  id: string
  order_number: number | null
  event_id: string
  event_name: string | null
  customer_name: string | null
  customer_email: string | null
  vehicle_plate: string | null
  item: string | null
  quantity: number
  status: string
  created_at: string | null
}

export type CourtesyPayload = {
  kind: CourtesyKind
  ticket_id: string
  customer_name: string
  customer_email: string
  customer_phone?: string
  vehicle_plate?: string
  customer_dni?: string
  quantity?: number
}

type Result<T> = { ok: true; data: T } | { ok: false; error: string; field?: string }

/** Genera una cortesía: pedido pagado a $0 a nombre de esa persona, con el QR por mail. */
export async function createCourtesy(eventId: string, payload: CourtesyPayload): Promise<Result<Courtesy>> {
  try {
    const res = await browserFetch(eventsPaths.workspace(eventId, 'courtesies'), {
      method: 'POST',
      headers: authHeadersJson(),
      body: JSON.stringify(payload),
    })
    const body = (await res.json().catch(() => ({}))) as { courtesy?: Courtesy; error?: string; field?: string }
    if (!res.ok || !body.courtesy) return { ok: false, error: body.error ?? 'No se pudo generar la cortesía', field: body.field }
    return { ok: true, data: body.courtesy }
  } catch {
    return { ok: false, error: 'No se pudo conectar con el servidor. Revisá tu conexión.' }
  }
}

/** Últimas cortesías (sobre el estacionamiento, las de todos sus eventos). */
export async function fetchCourtesies(eventId: string): Promise<Result<Courtesy[]>> {
  try {
    const res = await browserFetch(eventsPaths.workspace(eventId, 'courtesies'), { headers: authHeadersJson() })
    const body = (await res.json().catch(() => ({}))) as { courtesies?: Courtesy[]; error?: string }
    if (!res.ok) return { ok: false, error: body.error ?? 'No se pudieron cargar las cortesías' }
    return { ok: true, data: body.courtesies ?? [] }
  } catch {
    return { ok: false, error: 'No se pudo conectar con el servidor. Revisá tu conexión.' }
  }
}
