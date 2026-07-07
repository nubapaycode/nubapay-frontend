import { platformAdminPaths } from '@/lib/api'
import { authHeadersJson } from '@/lib/authSession'
import { browserFetch } from '@/lib/browserFetch'

export type PlatformPagination = {
  page: number
  page_size: number
  total: number
}

export type PlatformAdminUser = {
  id: string
  name: string
  email: string
  role: string
  partner: boolean
  tenant_id: string
  tenant_subdomain: string | null
  created_at: string | null
  onboarding_completed: boolean
}

export type PlatformAdminEvent = {
  id: string
  name: string
  slug: string
  status: string
  is_active: boolean
  starts_at: string | null
  ends_at: string | null
  tenant_subdomain: string | null
  organizer: { id: string; name: string; email: string } | null
  stats: {
    order_count: number
    total_revenue: number
    commission_amount: number
  }
}

export type PlatformAdminOrder = {
  id: string
  order_number: number | null
  event_id: string
  event_name: string | null
  tenant_subdomain: string | null
  customer_name: string | null
  customer_email: string | null
  status: string
  payment_status: string
  total_amount: number
  currency: string
  is_test: boolean
  created_at: string | null
}

export type PlatformRevenueByEvent = {
  event_id: string
  event_name: string
  starts_at: string | null
  tenant_subdomain: string | null
  order_count: number
  total_revenue: number
  commission_amount: number
}

export type PlatformAdminSummary = {
  total_users: number
  total_events: number
  total_orders: number
  total_revenue: number
  total_commission: number
}

export type PlatformAdminOverview = {
  summary: PlatformAdminSummary
}

type Result<T> = { ok: true; data: T } | { ok: false; error: string }

type PaginatedResult<T> = Result<T & { pagination: PlatformPagination }>

const DEFAULT_PAGE_SIZE = 20

async function parseJson<T>(res: Response): Promise<Result<T>> {
  let body: unknown
  try {
    body = await res.json()
  } catch {
    return { ok: false, error: 'Respuesta inválida del servidor' }
  }
  if (!res.ok) {
    const err =
      typeof body === 'object' && body !== null && 'error' in body
        ? String((body as { error: unknown }).error)
        : `Error ${res.status}`
    return { ok: false, error: err }
  }
  return { ok: true, data: body as T }
}

export async function fetchPlatformOverview(): Promise<Result<PlatformAdminOverview>> {
  const res = await browserFetch(platformAdminPaths.overview(), {
    headers: authHeadersJson(),
  })
  return parseJson<PlatformAdminOverview>(res)
}

export async function fetchPlatformUsers(
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE,
): Promise<PaginatedResult<{ users: PlatformAdminUser[] }>> {
  const res = await browserFetch(platformAdminPaths.users({ page, page_size: pageSize }), {
    headers: authHeadersJson(),
  })
  return parseJson(res)
}

export async function fetchPlatformEvents(
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE,
): Promise<PaginatedResult<{ events: PlatformAdminEvent[] }>> {
  const res = await browserFetch(platformAdminPaths.events({ page, page_size: pageSize }), {
    headers: authHeadersJson(),
  })
  return parseJson(res)
}

export async function fetchPlatformOrders(
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE,
): Promise<PaginatedResult<{ orders: PlatformAdminOrder[] }>> {
  const res = await browserFetch(platformAdminPaths.orders({ page, page_size: pageSize }), {
    headers: authHeadersJson(),
  })
  return parseJson(res)
}

export async function fetchPlatformRevenueByEvent(
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE,
): Promise<PaginatedResult<{ revenue_by_event: PlatformRevenueByEvent[] }>> {
  const res = await browserFetch(platformAdminPaths.revenueByEvent({ page, page_size: pageSize }), {
    headers: authHeadersJson(),
  })
  return parseJson(res)
}

export async function fetchPlatformUpcomingEvents(
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE,
): Promise<PaginatedResult<{ events: PlatformAdminEvent[] }>> {
  const res = await browserFetch(platformAdminPaths.upcomingEvents({ page, page_size: pageSize }), {
    headers: authHeadersJson(),
  })
  return parseJson(res)
}

export { DEFAULT_PAGE_SIZE as PLATFORM_ADMIN_PAGE_SIZE }
