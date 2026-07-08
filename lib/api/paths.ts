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
  forgotPassword: () => apiUrl('/auth/forgot-password'),
  resetPassword: () => apiUrl('/auth/reset-password'),
  completeOnboarding: () => apiUrl('/auth/complete-onboarding'),
}

export const catalogPaths = {
  bySlug: (slug: string) => {
    const s = encodeURIComponent(slug)
    return apiUrl(`/catalog/by-slug/${s}`)
  },
  /** Catálogo comprador (productos + combos) por slug público. */
  storefrontBySlug: (slug: string) => {
    const s = encodeURIComponent(slug)
    return apiUrl(`/catalog/storefront/${s}`)
  },
  /** Crea una orden pública (sin auth). POST con { customer_name, payment_method, items }. */
  createOrder: (slug: string) => {
    const s = encodeURIComponent(slug)
    return apiUrl(`/catalog/storefront/${s}/orders`)
  },
  /** Consulta pública del estado de una orden por ID. */
  orderStatus: (orderId: string) => {
    return apiUrl(`/catalog/orders/${encodeURIComponent(orderId)}`)
  },
  /** Adjunta nombre/email a una orden creada sin datos (checkout en dos pasos). */
  updateOrderCustomer: (orderId: string) => {
    return apiUrl(`/catalog/orders/${encodeURIComponent(orderId)}/customer`)
  },
}

export const partnerTenantPaths = {
  tenant: () => apiUrl('/me/tenant'),
  provision: () => apiUrl('/me/tenant/provision'),
  domains: () => apiUrl('/me/tenant/domains'),
  domain: (domainId: string) => apiUrl(`/me/tenant/domains/${encodeURIComponent(domainId)}`),
  domainVerify: (domainId: string) =>
    apiUrl(`/me/tenant/domains/${encodeURIComponent(domainId)}/verify`),
}

export const publicPaths = {
  tenantByHost: () => apiUrl('/public/tenant-by-host'),
}

export const platformAdminPaths = {
  overview: () => apiUrl('/platform/overview'),
  users: (opts?: { page?: number; page_size?: number; q?: string }) => {
    const base = apiUrl('/platform/users')
    const q = new URLSearchParams()
    if (opts?.page !== undefined) q.set('page', String(opts.page))
    if (opts?.page_size !== undefined) q.set('page_size', String(opts.page_size))
    if (opts?.q) q.set('q', opts.q)
    const s = q.toString()
    return s ? `${base}?${s}` : base
  },
  events: (opts?: { page?: number; page_size?: number }) => {
    const base = apiUrl('/platform/events')
    const q = new URLSearchParams()
    if (opts?.page !== undefined) q.set('page', String(opts.page))
    if (opts?.page_size !== undefined) q.set('page_size', String(opts.page_size))
    const s = q.toString()
    return s ? `${base}?${s}` : base
  },
  orders: (opts?: { page?: number; page_size?: number }) => {
    const base = apiUrl('/platform/orders')
    const q = new URLSearchParams()
    if (opts?.page !== undefined) q.set('page', String(opts.page))
    if (opts?.page_size !== undefined) q.set('page_size', String(opts.page_size))
    const s = q.toString()
    return s ? `${base}?${s}` : base
  },
  revenueByEvent: (opts?: { page?: number; page_size?: number }) => {
    const base = apiUrl('/platform/revenue-by-event')
    const q = new URLSearchParams()
    if (opts?.page !== undefined) q.set('page', String(opts.page))
    if (opts?.page_size !== undefined) q.set('page_size', String(opts.page_size))
    const s = q.toString()
    return s ? `${base}?${s}` : base
  },
  upcomingEvents: (opts?: { page?: number; page_size?: number }) => {
    const base = apiUrl('/platform/events/upcoming')
    const q = new URLSearchParams()
    if (opts?.page !== undefined) q.set('page', String(opts.page))
    if (opts?.page_size !== undefined) q.set('page_size', String(opts.page_size))
    const s = q.toString()
    return s ? `${base}?${s}` : base
  },
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
  /** Subrecursos bajo `/api/events/:id/…` (panel organizador), ej. `orders`, `cover`. */
  workspace: (eventId: string, segment: string) => {
    const s = segment.startsWith('/') ? segment.slice(1) : segment
    return apiUrl(`/events/${eventId}/${s}`)
  },
}
