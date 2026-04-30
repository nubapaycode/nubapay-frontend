/**
 * Rutas HTTP del backend Flask, alineadas con `nubapay-backend/routes/`
 * (`system`, `auth`, `events`, `event_workspace`).
 */
import { apiUrl } from '../api'

export const systemPaths = {
  health: () => apiUrl('/health'),
}

export const authPaths = {
  login: () => apiUrl('/auth/login'),
  register: () => apiUrl('/auth/register'),
  me: () => apiUrl('/auth/me'),
}

export const eventsPaths = {
  list: (opts?: { page?: number; page_size?: number }) => {
    const base = apiUrl('/events')
    if (opts?.page === undefined && opts?.page_size === undefined) return base
    const q = new URLSearchParams()
    if (opts.page !== undefined) q.set('page', String(opts.page))
    if (opts.page_size !== undefined) q.set('page_size', String(opts.page_size))
    const s = q.toString()
    return s ? `${base}?${s}` : base
  },
  detail: (eventId: string) => apiUrl(`/events/${eventId}`),
  /** Subrecursos bajo `/api/events/:id/…` (panel organizador, `event_workspace`). */
  workspace: (eventId: string, segment: string) => {
    const s = segment.startsWith('/') ? segment.slice(1) : segment
    return apiUrl(`/events/${eventId}/${s}`)
  },
}
