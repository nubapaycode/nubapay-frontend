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

// ---------------------------------------------------------------------------
// Load testing
// ---------------------------------------------------------------------------

export const LOAD_TEST_TARGETS = [100, 500, 1000, 2000] as const
export type LoadTestTarget = (typeof LOAD_TEST_TARGETS)[number]
export type LoadTestPaymentMethod = 'mp' | 'cash' | 'transfer'

export type LoadTestProduct = {
  id: string
  name: string
  price: number
  currency: string
  type: string
}

export type LoadTestStat = {
  avg: number | null
  p50: number | null
  p95: number | null
  p99: number | null
  max: number | null
  count: number
}

export type LoadTestSummary = {
  target: number
  created: number
  checkout_ok: number
  errors: number
  create_error_rate: number | null
  checkout_error_rate: number | null
  duration_s: number
  throughput_per_s: number | null
  create_ms: LoadTestStat
  checkout_ms: LoadTestStat
  total_ms: LoadTestStat
}

export type LoadTestRun = {
  id: string
  event_id: string | null
  event_name: string | null
  event_slug: string
  product_name: string | null
  branded_host: string
  payment_method: LoadTestPaymentMethod
  target_count: number
  status: 'running' | 'completed' | 'failed'
  created_count: number
  checkout_count: number
  error_count: number
  started_at: string | null
  finished_at: string | null
  summary: LoadTestSummary | null
  created_by_name: string | null
  purged_at: string | null
  purged_count: number | null
}

export async function fetchEventProducts(eventId: string): Promise<Result<{ products: LoadTestProduct[] }>> {
  const res = await browserFetch(platformAdminPaths.eventProducts(eventId), {
    headers: authHeadersJson(),
  })
  return parseJson(res)
}

export async function fetchLoadTests(
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE,
): Promise<PaginatedResult<{ runs: LoadTestRun[] }>> {
  const res = await browserFetch(platformAdminPaths.loadTests({ page, page_size: pageSize }), {
    headers: authHeadersJson(),
  })
  return parseJson(res)
}

export async function fetchLoadTest(runId: string): Promise<Result<LoadTestRun>> {
  const res = await browserFetch(platformAdminPaths.loadTest(runId), {
    headers: authHeadersJson(),
  })
  return parseJson(res)
}

export async function startLoadTest(input: {
  event_id: string
  product_id: string
  target_count: LoadTestTarget
  payment_method: LoadTestPaymentMethod
}): Promise<Result<{ run_id: string; status: string }>> {
  const res = await browserFetch(platformAdminPaths.loadTests(), {
    method: 'POST',
    headers: authHeadersJson(),
    body: JSON.stringify(input),
  })
  return parseJson(res)
}

export async function purgeLoadTest(runId: string): Promise<Result<{ ok: boolean; deleted: number }>> {
  const res = await browserFetch(platformAdminPaths.loadTestPurge(runId), {
    method: 'POST',
    headers: authHeadersJson(),
  })
  return parseJson(res)
}

/** Descarga el log de una corrida como archivo .txt (dispara el diálogo "guardar como"). */
export async function downloadLoadTestLog(runId: string): Promise<Result<true>> {
  const res = await browserFetch(platformAdminPaths.loadTestLog(runId), {
    headers: authHeadersJson(),
  })
  if (!res.ok) {
    return { ok: false, error: `Error ${res.status}` }
  }
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `load_test_${runId}.txt`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
  return { ok: true, data: true }
}
