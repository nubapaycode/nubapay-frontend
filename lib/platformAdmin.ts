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
  /** Estado real en la DB (`status` lo colapsa a los estados de la UI del organizador). */
  status_raw: string
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

export type PlatformSettings = {
  payments_enabled: boolean
  effective?: boolean
}

export type { Result as PlatformResult }

export async function fetchPlatformSettings(): Promise<Result<PlatformSettings>> {
  const res = await browserFetch(platformAdminPaths.settings(), {
    headers: authHeadersJson(),
  })
  return parseJson<PlatformSettings>(res)
}

export async function updatePlatformSettings(
  paymentsEnabled: boolean,
): Promise<Result<PlatformSettings>> {
  const res = await browserFetch(platformAdminPaths.settings(), {
    method: 'PATCH',
    headers: authHeadersJson(),
    body: JSON.stringify({ payments_enabled: paymentsEnabled }),
  })
  return parseJson<PlatformSettings>(res)
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


// ---------------------------------------------------------------------------
// Métricas, salud, búsqueda, órdenes, eventos y liquidación
// ---------------------------------------------------------------------------

type Params = Record<string, string | number | boolean | null | undefined>

async function getJson<T>(suffix: string, params?: Params): Promise<Result<T>> {
  try {
    const res = await browserFetch(platformAdminPaths.path(suffix, params), {
      headers: authHeadersJson(),
    })
    return parseJson<T>(res)
  } catch {
    return { ok: false, error: 'No se pudo conectar con el servidor' }
  }
}

async function sendJson<T>(
  suffix: string,
  method: 'POST' | 'PATCH',
  body?: unknown,
): Promise<Result<T>> {
  try {
    const res = await browserFetch(platformAdminPaths.path(suffix), {
      method,
      headers: authHeadersJson(),
      body: body === undefined ? undefined : JSON.stringify(body),
    })
    return parseJson<T>(res)
  } catch {
    return { ok: false, error: 'No se pudo conectar con el servidor' }
  }
}

export type DateRangeParams = { days?: number; from?: string; to?: string }

export type TimeseriesPoint = {
  date: string
  created: number
  paid_orders: number
  revenue: number
  commission: number
}

export type PeriodTotals = {
  created: number
  paid_orders: number
  revenue: number
  commission: number
  avg_ticket: number
  conversion: number
}

export type PlatformStats = {
  range: { from: string; to: string; days: number; tz: string }
  series: TimeseriesPoint[]
  totals: PeriodTotals & { units: number }
  previous: PeriodTotals
  /** Variación % contra el período anterior (conversion en puntos). null = sin base. */
  deltas: Record<'revenue' | 'commission' | 'paid_orders' | 'avg_ticket' | 'conversion', number | null>
  funnel: {
    created: number
    paid: number
    redeemed: number
    cancelled: number
    failed: number
    abandoned: number
  }
  payment_methods: { provider: string; orders: number; revenue: number }[]
  top_events: { event_id: string; name: string; tenant_subdomain: string | null; paid_orders: number; revenue: number }[]
}

export function fetchPlatformStats(range: DateRangeParams, includeTest: boolean) {
  return getJson<PlatformStats>('/stats/timeseries', { ...range, include_test: includeTest })
}

export type HealthProblem = PlatformAdminOrder & { reason: string; age_minutes: number | null }

export type PlatformHealth = {
  checked_at: string
  db: { ok: boolean; latency_ms: number }
  redis: { ok: boolean; latency_ms: number | null; error: string | null }
  queues: { name: string; queued: number; started: number; failed: number }[]
  workers: { name: string; state: string; queues: string[]; last_heartbeat: string | null; alive: boolean }[]
  payments: { saved: boolean; effective: boolean; updated_at: string | null; updated_by: string | null }
  problems: HealthProblem[]
  abandoned_carts: number
  alerts: { level: 'critical' | 'warning'; message: string }[]
}

export function fetchPlatformHealth() {
  return getJson<PlatformHealth>('/health')
}

export type SearchResults = {
  orders: PlatformAdminOrder[]
  events: { id: string; name: string; slug: string; status: string; is_active: boolean; tenant_subdomain: string | null }[]
  users: { id: string; name: string; email: string; role: string }[]
}

export function searchPlatform(q: string) {
  return getJson<SearchResults>('/search', { q })
}

export type OrderFilters = {
  q?: string
  status?: string
  payment_status?: string
  event_id?: string
  from?: string
  to?: string
  sort?: string
  include_test?: boolean
}

export function fetchPlatformOrdersFiltered(page: number, pageSize: number, f: OrderFilters) {
  return getJson<{ orders: PlatformAdminOrder[]; pagination: PlatformPagination }>('/orders', {
    ...f,
    page,
    page_size: pageSize,
  })
}

export function fetchPlatformEventsFiltered(
  page: number,
  pageSize: number,
  f: { q?: string; status?: string; active?: '0' | '1' | '' },
) {
  return getJson<{ events: PlatformAdminEvent[]; pagination: PlatformPagination }>('/events', {
    ...f,
    page,
    page_size: pageSize,
  })
}

export function fetchPlatformUsersFiltered(page: number, pageSize: number, q: string) {
  return getJson<{ users: PlatformAdminUser[]; pagination: PlatformPagination }>('/users', {
    q,
    page,
    page_size: pageSize,
  })
}

async function downloadCsv(suffix: string, params: Params, filename: string): Promise<Result<true>> {
  try {
    const res = await browserFetch(platformAdminPaths.path(suffix, params), {
      headers: authHeadersJson(),
    })
    if (!res.ok) return { ok: false, error: `Error ${res.status}` }
    const url = URL.createObjectURL(await res.blob())
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
    return { ok: true, data: true }
  } catch {
    return { ok: false, error: 'No se pudo descargar el archivo' }
  }
}

export function downloadOrdersCsv(f: OrderFilters) {
  return downloadCsv('/orders/export', f, `ordenes-${new Date().toISOString().slice(0, 10)}.csv`)
}

export type AdminOrderDetail = PlatformAdminOrder & {
  customer_phone: string | null
  notes: string | null
  qr_used_at: string | null
  delivered_at: string | null
  cancelled_at: string | null
  updated_at: string | null
  items: { name: string; unit_price: number; quantity: number; subtotal: number; redeemed_quantity: number }[]
  payments: {
    provider: string
    status: string
    amount: number
    provider_payment_id: string | null
    paid_at: string | null
    created_at: string | null
  }[]
  history: {
    from_status: string | null
    to_status: string
    note: string | null
    by: string | null
    created_at: string | null
  }[]
  qr_logs: { result: string; message: string | null; created_at: string | null }[]
}

export function fetchPlatformOrderDetail(orderId: string) {
  return getJson<{ order: AdminOrderDetail }>(`/orders/${encodeURIComponent(orderId)}`)
}

export function resendOrderConfirmation(orderId: string) {
  return sendJson<{ ok: true; sent_to: string }>(
    `/orders/${encodeURIComponent(orderId)}/resend-confirmation`,
    'POST',
  )
}

export function cancelOrderAsAdmin(orderId: string, reason: string) {
  return sendJson<{ ok: true; status: string }>(`/orders/${encodeURIComponent(orderId)}/cancel`, 'POST', {
    reason,
  })
}

export function markOrderPaidAsAdmin(orderId: string, reason: string) {
  return sendJson<{ ok: true; status: string; payment_status: string }>(
    `/orders/${encodeURIComponent(orderId)}/mark-paid`,
    'POST',
    { reason },
  )
}

export type AdminEventDetail = {
  event: {
    id: string
    name: string
    slug: string
    status: string
    is_active: boolean
    starts_at: string | null
    ends_at: string | null
    tenant_subdomain: string | null
    organizer: { id: string; name: string; email: string } | null
    has_mp: boolean
    has_sipago: boolean
    cash_enabled: boolean
  }
  stats: {
    orders_created: number
    paid_orders: number
    revenue: number
    commission: number
    avg_ticket: number
    units_sold: number
    units_redeemed: number
    redemption_rate: number
    staff_count: number
    product_count: number
  }
  status_counts: Record<string, number>
  top_products: { name: string; quantity: number; revenue: number }[]
  series: { date: string; revenue: number; created: number }[]
  payment_methods: { provider: string; orders: number; revenue: number }[]
}

export function fetchPlatformEventDetail(eventId: string) {
  return getJson<AdminEventDetail>(`/events/${encodeURIComponent(eventId)}/detail`)
}

export function setEventSalesActive(eventId: string, isActive: boolean) {
  return sendJson<{ ok: true; is_active: boolean }>(
    `/events/${encodeURIComponent(eventId)}/controls`,
    'PATCH',
    { is_active: isActive },
  )
}

export type SettlementRow = {
  event_id: string
  event_name: string
  organizer_name: string
  organizer_email: string
  paid_orders: number
  revenue: number
  commission: number
  payout: number
}

export type Settlement = {
  range: { from: string; to: string }
  commission_rate: number
  events: SettlementRow[]
  organizers: {
    organizer_name: string
    organizer_email: string
    events: number
    paid_orders: number
    revenue: number
    commission: number
    payout: number
  }[]
  totals: { revenue: number; commission: number; payout: number; paid_orders: number }
}

export function fetchSettlement(range: DateRangeParams) {
  return getJson<Settlement>('/settlement', range)
}

export function downloadSettlementCsv(range: DateRangeParams) {
  return downloadCsv(
    '/settlement',
    { ...range, format: 'csv' },
    `liquidacion-${new Date().toISOString().slice(0, 10)}.csv`,
  )
}

export type AdminActivity = {
  order_id: string
  order_number: number | null
  event_name: string
  by: string
  from_status: string | null
  to_status: string
  note: string | null
  admin_action: boolean
  created_at: string | null
}

export function fetchAdminActivity() {
  return getJson<{ activity: AdminActivity[] }>('/activity')
}
