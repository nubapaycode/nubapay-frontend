import { eventsPaths } from '@/lib/api'
import type { OrganizerStaffTools } from '@/lib/authSession'
import { authHeadersJson } from '@/lib/authSession'
import { browserFetch } from '@/lib/browserFetch'

export type EventStaffRow = {
  id: string
  user_id: string
  email: string
  name: string
  role: string
  tools: OrganizerStaffTools
}

export async function fetchEventStaffList(
  eventId: string,
): Promise<{ ok: true; staff: EventStaffRow[] } | { ok: false; error: string }> {
  const res = await browserFetch(eventsPaths.workspace(eventId, 'staff'), {
    headers: authHeadersJson(),
  })
  const body = (await res.json()) as { staff?: EventStaffRow[]; error?: string }
  if (!res.ok) return { ok: false, error: body.error ?? 'No se pudo cargar el equipo' }
  return { ok: true, staff: body.staff ?? [] }
}

export async function inviteEventStaff(
  eventId: string,
  payload: {
    email: string
    name: string
    role: string
    tools: OrganizerStaffTools
  },
): Promise<
  | { ok: true; staff: EventStaffRow; email_sent: boolean; email_error?: string }
  | { ok: false; error: string; detail?: string }
> {
  const res = await browserFetch(eventsPaths.workspace(eventId, 'staff'), {
    method: 'POST',
    headers: authHeadersJson(),
    body: JSON.stringify({
      email: payload.email,
      name: payload.name,
      role: payload.role,
      tools: payload.tools,
    }),
  })
  const body = (await res.json()) as {
    staff?: EventStaffRow
    email_sent?: boolean
    email_error?: string
    error?: string
    detail?: string
  }
  if (!res.ok) return { ok: false, error: body.error ?? 'Error', detail: body.detail }
  if (!body.staff) return { ok: false, error: 'Respuesta inválida' }
  return {
    ok: true,
    staff: body.staff,
    email_sent: body.email_sent !== false,
    email_error: body.email_error,
  }
}

export async function resendEventStaffInviteEmail(
  eventId: string,
  staffRowId: string,
): Promise<
  | { ok: true; email_sent: boolean; email_error?: string }
  | { ok: false; error: string; detail?: string }
> {
  const res = await browserFetch(
    eventsPaths.workspace(eventId, `staff/${staffRowId}/resend-email`),
    {
      method: 'POST',
      headers: authHeadersJson(),
    },
  )
  const body = (await res.json()) as {
    email_sent?: boolean
    email_error?: string
    error?: string
    detail?: string
  }
  if (!res.ok) return { ok: false, error: body.error ?? 'Error', detail: body.detail }
  return {
    ok: true,
    email_sent: body.email_sent !== false,
    email_error: body.email_error,
  }
}

export async function patchEventStaff(
  eventId: string,
  staffRowId: string,
  payload: Partial<{ role: string; tools: OrganizerStaffTools }>,
): Promise<{ ok: true; staff: EventStaffRow } | { ok: false; error: string }> {
  const res = await browserFetch(eventsPaths.workspace(eventId, `staff/${staffRowId}`), {
    method: 'PATCH',
    headers: authHeadersJson(),
    body: JSON.stringify(payload),
  })
  const body = (await res.json()) as { staff?: EventStaffRow; error?: string }
  if (!res.ok || !body.staff) return { ok: false, error: body.error ?? 'Error' }
  return { ok: true, staff: body.staff }
}

export async function deleteEventStaff(
  eventId: string,
  staffRowId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const res = await browserFetch(eventsPaths.workspace(eventId, `staff/${staffRowId}`), {
    method: 'DELETE',
    headers: authHeadersJson(),
  })
  const body = (await res.json()) as { error?: string }
  if (!res.ok) return { ok: false, error: body.error ?? 'Error' }
  return { ok: true }
}
