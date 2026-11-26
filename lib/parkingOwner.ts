import { authHeadersJson } from '@/lib/authSession'
import { eventRequestPaths, eventsPaths, parkingOwnerPaths } from '@/lib/api'
import { browserFetch } from '@/lib/browserFetch'
import type { OrganizerEventRow } from '@/lib/types/organizer'

export type SubmissionStatus = 'pending' | 'approved' | 'rejected'
export type EventsTab = SubmissionStatus

export type EventSubmission = {
  id: string
  status: SubmissionStatus
  organizer_name: string
  organizer_email: string
  organizer_phone: string
  event_name: string
  description: string | null
  starts_at: string | null
  ends_at: string | null
  cover_image_url: string | null
  reject_reason: string | null
  event_id: string | null
  reviewed_at: string | null
  created_at: string | null
}

export type ParkingOwnerCounts = Record<EventsTab, number>

export type ParkingOwnerAccount = {
  base_event_id: string
  name: string
  /** Slug público: arma el link del formulario de solicitudes. */
  slug: string
  accepts_event_submissions: boolean
  counts: ParkingOwnerCounts
  /** Medios de pago conectados del estacionamiento. Ausente en respuestas viejas. */
  payments?: { mp: boolean; sipago: boolean; mobbex: boolean }
}

/** Fila de la lista: solicitud (pendientes/rechazados) o evento ya creado con su solicitud de origen (aprobados). */
export type ParkingOwnerEventItem = {
  event: OrganizerEventRow | null
  submission: EventSubmission | null
}

export type ParkingOwnerEventsPage = {
  tab: EventsTab
  items: ParkingOwnerEventItem[]
  counts: ParkingOwnerCounts
  pagination: { page: number; page_size: number; total: number; total_pages?: number }
}

type Result<T> = { ok: true; data: T } | { ok: false; error: string }

const CONNECTION_ERROR = 'No se pudo conectar con el servidor. Revisá tu conexión.'

async function request<T>(url: string, init: RequestInit, fallbackError: string): Promise<Result<T>> {
  try {
    const res = await browserFetch(url, init)
    const body = (await res.json().catch(() => ({}))) as { error?: string } & Record<string, unknown>
    if (!res.ok) return { ok: false, error: body.error ?? fallbackError }
    return { ok: true, data: body as T }
  } catch {
    return { ok: false, error: CONNECTION_ERROR }
  }
}

export async function fetchParkingOwnerAccount(): Promise<Result<ParkingOwnerAccount>> {
  const r = await request<{ account: ParkingOwnerAccount }>(
    parkingOwnerPaths.account(),
    { headers: authHeadersJson() },
    'No se pudo cargar tu estacionamiento',
  )
  return r.ok ? { ok: true, data: r.data.account } : r
}

export async function patchParkingOwnerAccount(
  patch: Partial<Pick<ParkingOwnerAccount, 'accepts_event_submissions' | 'name' | 'slug'>>,
): Promise<Result<ParkingOwnerAccount>> {
  const r = await request<{ account: ParkingOwnerAccount }>(
    parkingOwnerPaths.account(),
    { method: 'PATCH', headers: authHeadersJson(), body: JSON.stringify(patch) },
    'No se pudo guardar el cambio',
  )
  return r.ok ? { ok: true, data: r.data.account } : r
}

export async function fetchParkingOwnerEvents(
  tab: EventsTab,
  page = 1,
  pageSize = 20,
): Promise<Result<ParkingOwnerEventsPage>> {
  return request<ParkingOwnerEventsPage>(
    parkingOwnerPaths.events({ tab, page, page_size: pageSize }),
    { headers: authHeadersJson() },
    'No se pudo cargar la lista',
  )
}

export async function approveSubmission(submissionId: string): Promise<Result<{ event: OrganizerEventRow }>> {
  return request<{ event: OrganizerEventRow }>(
    parkingOwnerPaths.approve(submissionId),
    { method: 'POST', headers: authHeadersJson() },
    'No se pudo aprobar la solicitud',
  )
}

export async function rejectSubmission(
  submissionId: string,
  reason: string,
): Promise<Result<{ submission: EventSubmission }>> {
  return request<{ submission: EventSubmission }>(
    parkingOwnerPaths.reject(submissionId),
    { method: 'POST', headers: authHeadersJson(), body: JSON.stringify({ reason }) },
    'No se pudo rechazar la solicitud',
  )
}

/** Datos del formulario público de solicitud (los arma `EventRequestForm`). */
export async function submitEventRequest(slug: string, form: FormData): Promise<Result<{ ok: true }>> {
  try {
    const res = await browserFetch(eventRequestPaths.form(slug), {
      method: 'POST',
      headers: { 'X-Branded-Host': window.location.host },
      body: form,
    })
    const body = (await res.json().catch(() => ({}))) as { error?: string }
    if (!res.ok) return { ok: false, error: body.error ?? 'No pudimos enviar tu solicitud. Intentá de nuevo.' }
    return { ok: true, data: { ok: true } }
  } catch {
    return { ok: false, error: CONNECTION_ERROR }
  }
}

export type ParkingOwnerEventOption = { id: string; name: string; starts_at: string | null }

/** Eventos del estacionamiento para el selector de las vistas de operación (sin el evento base). */
export async function fetchParkingOwnerEventOptions(): Promise<Result<ParkingOwnerEventOption[]>> {
  const r = await request<{ events: (OrganizerEventRow & { is_parking_base?: boolean })[] }>(
    eventsPaths.list({ page: 1, page_size: 100 }),
    { headers: authHeadersJson() },
    'No se pudieron cargar los eventos',
  )
  if (!r.ok) return r
  return {
    ok: true,
    data: r.data.events
      .filter(e => e.membership !== 'staff' && !e.is_parking_base)
      .map(e => ({ id: e.id, name: e.name, starts_at: e.starts_at })),
  }
}
