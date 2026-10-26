import { eventsPaths } from '@/lib/api'
import { authHeadersJson } from '@/lib/authSession'
import { browserFetch } from '@/lib/browserFetch'
import type { Order, OrderStatus } from '@/types'

export type WorkspaceCategory = {
  id: string
  name: string
  sort_order: number
  is_active: boolean
}

export type WorkspaceProduct = {
  id: string
  event_id: string
  category_id: string | null
  category_name: string | null
  name: string
  description: string
  price: number
  currency: string
  type: 'single' | 'combo'
  is_active: boolean
  image_url: string | null
  combo_lines: { product_id: string; quantity: number; name: string }[]
}

export type DashboardPaymentKey = 'mp' | 'cash' | 'transfer'

export type DashboardSeriesPoint = {
  label: string
  revenue: number
  orders?: number
  /** Mismo punto del período anterior (solo con rango). */
  prev_revenue?: number
  prev_orders?: number
}

export type DashboardSummary = {
  total_revenue: number
  order_count: number
  /** Recaudado / pedidos del período. */
  avg_ticket?: number
  active_orders: number
  delivered_orders: number
  by_status: Record<OrderStatus, number>
  hourly: { hour: string; revenue: number }[]
  /** Gráfico de ventas: por hora (últimas 8 h) sin rango, por día con rango. */
  series?: { kind: 'hourly' | 'daily'; points: DashboardSeriesPoint[] }
  /** Rango aplicado (null = todo el evento). */
  range?: { from: string; to: string } | null
  /** Totales del período anterior de igual duración (null sin rango). */
  comparison?: {
    total_revenue: number
    order_count: number
    avg_ticket: number
    range: { from: string; to: string }
  } | null
  filters?: { payment: DashboardPaymentKey | null; product: string | null }
  payment_breakdown: { key: DashboardPaymentKey; count: number; revenue: number }[]
  top_products: { name: string; quantity: number; revenue: number }[]
  /** Ritmo de los últimos minutos, sin rango ni filtros. */
  live?: { orders_last_hour: number; revenue_last_hour: number; per_minute: number[] }
}

export type WorkspacePayment = {
  id: string
  order_id: string
  order_number?: number | null
  customer_name?: string | null
  amount: number
  currency: string
  status: string
  provider: string
  paid_at: string | null
  created_at: string | null
  channel: string | null
}

export type WorkspacePickupPoint = {
  id: string
  name: string
  description: string
  is_active: boolean
  products: {
    product_id: string
    name: string
    type: string
    is_active: boolean
  }[]
}

export type WorkspaceCatalogBlock = {
  id: string
  title: string
  banner_image_url: string | null
  sort_order: number
  is_active: boolean
  products: {
    product_id: string
    name: string
    type: string
    is_active: boolean
  }[]
}

export type WorkspaceTicket = {
  id: string
  name: string
  description: string
  price: number
  currency: string
  /** Stock máximo; `null` = sin límite. */
  stock: number | null
  /** Unidades vendidas o reservadas (pedidos no cancelados ni fallidos). */
  sold: number
  /** Recaudado con pedidos pagados (sin cancelados). */
  revenue?: number
  /** Unidades ya escaneadas en la entrada. */
  redeemed?: number
  sort_order: number
  is_active: boolean
}

export type PaginationMeta = {
  page: number
  page_size: number
  total: number
}

function workspacePath(eventId: string, sub: string, query?: Record<string, string | number | boolean | undefined>) {
  const path = sub.startsWith('/') ? sub.slice(1) : sub
  let url = eventsPaths.workspace(eventId, path)
  if (query && Object.keys(query).length > 0) {
    const q = new URLSearchParams()
    for (const [k, v] of Object.entries(query)) {
      if (v === undefined || v === '') continue
      q.set(k, typeof v === 'boolean' ? (v ? 'true' : 'false') : String(v))
    }
    if ([...q.keys()].length > 0) url += `?${q.toString()}`
  }
  return url
}

export type WorkspaceProductsFilters = {
  /** Busca en nombre y descripción (insensible a mayúsculas). */
  q?: string
  type?: 'single' | 'combo'
  /** UUID de categoría o `'none'` solo sin categoría. */
  categoryId?: string
  /** Solo en venta (`true`) o solo pausados (`false`). */
  isActive?: boolean
  /** Solo los que no tienen foto. */
  noImage?: boolean
}

/** Conteos del catálogo: por tipo (pestañas) y por estado dentro del tipo elegido. */
export type WorkspaceProductsCounts = {
  single: number
  combo: number
  total: number
  active: number
  paused: number
  no_image: number
}

function readPagination(body: { pagination?: Partial<PaginationMeta> }, itemCount: number): PaginationMeta {
  const p = body.pagination
  if (p && typeof p.page === 'number' && typeof p.page_size === 'number' && typeof p.total === 'number') {
    return { page: p.page, page_size: p.page_size, total: p.total }
  }
  return { page: 1, page_size: Math.max(itemCount, 1), total: itemCount }
}

/** Rango de fechas (YYYY-MM-DD, inclusive, hora de Argentina). Sin rango = todo el evento. */
export type DashboardRange = { from: string; to: string }

/** Filtro cruzado del panel: por método de pago y/o por producto. */
export type DashboardFilters = { payment?: DashboardPaymentKey | null; product?: string | null }

export async function fetchEventDashboard(
  eventId: string,
  range?: DashboardRange | null,
  filters?: DashboardFilters,
): Promise<{ ok: true; data: DashboardSummary } | { ok: false; error: string }> {
  const query = {
    from: range?.from,
    to: range?.to,
    payment: filters?.payment ?? undefined,
    product: filters?.product ?? undefined,
  }
  const res = await browserFetch(workspacePath(eventId, 'dashboard', query), {
    headers: authHeadersJson(),
  })
  const body = (await res.json()) as DashboardSummary & { error?: string }
  if (!res.ok) return { ok: false, error: body.error ?? 'Error al cargar métricas' }
  return { ok: true, data: body as DashboardSummary }
}

export type WorkspaceOrdersFilters = {
  q?: string
  /** Estado de la UI; `unredeemed` agrupa los pagados que todavía no se retiraron. */
  status?: string
  paymentStatus?: string
  payment?: DashboardPaymentKey | null
  /** Nombres de categoría; el pedido entra si tiene algún ítem de alguna. */
  categories?: string[]
}

/** Filtros del listado de pedidos como query string (los comparten el listado y la exportación). */
function ordersFilterQuery(f?: WorkspaceOrdersFilters): Record<string, string | undefined> {
  return {
    q: f?.q?.trim() || undefined,
    status: f?.status?.trim() || undefined,
    payment_status: f?.paymentStatus?.trim() || undefined,
    payment: f?.payment || undefined,
    category: f?.categories?.length ? f.categories.join(',') : undefined,
  }
}

export type OrdersStatusCounts = {
  unredeemed: number
  partially_delivered: number
  delivered: number
  cancelled: number
}

/** Totales del filtro actual (sin cancelados): lo cobrado y el avance de retiro. */
export type OrdersSummary = { revenue: number; units: number; redeemed_units: number }

export async function fetchWorkspaceOrders(
  eventId: string,
  opts?: { page?: number; pageSize?: number } & WorkspaceOrdersFilters,
): Promise<
  | {
      ok: true
      orders: Order[]
      pagination: PaginationMeta
      statusCounts: OrdersStatusCounts | null
      summary: OrdersSummary | null
    }
  | { ok: false; error: string }
> {
  const query = {
    page: opts?.page ?? 1,
    page_size: opts?.pageSize ?? 40,
    ...ordersFilterQuery(opts),
  }
  const res = await browserFetch(workspacePath(eventId, 'orders', query), {
    headers: authHeadersJson(),
  })
  const body = (await res.json()) as {
    orders?: Order[]
    pagination?: Partial<PaginationMeta>
    status_counts?: OrdersStatusCounts
    summary?: OrdersSummary
    error?: string
  }
  if (!res.ok) return { ok: false, error: body.error ?? 'Error al cargar pedidos' }
  const orders = body.orders ?? []
  return {
    ok: true,
    orders,
    pagination: readPagination(body, orders.length),
    statusCounts: body.status_counts ?? null,
    summary: body.summary ?? null,
  }
}

/**
 * Descarga el CSV de pedidos con los filtros dados (o solo `ids`, si se pasan).
 * Va por `fetch` porque el endpoint pide el token en el header; después se dispara la descarga en el navegador.
 */
export async function downloadOrdersCsv(
  eventId: string,
  filters: WorkspaceOrdersFilters & { ids?: string[] },
): Promise<{ ok: true } | { ok: false; error: string }> {
  const query = { ...ordersFilterQuery(filters), ids: filters.ids?.length ? filters.ids.join(',') : undefined }
  const res = await browserFetch(workspacePath(eventId, 'orders/export', query), { headers: authHeadersJson() })
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string }
    return { ok: false, error: body.error ?? 'No se pudo exportar' }
  }
  const blob = await res.blob()
  // Con CORS el navegador no siempre expone Content-Disposition: el nombre se arma también acá.
  const disposition = res.headers.get('Content-Disposition') ?? ''
  const stamp = new Date().toISOString().slice(0, 16).replace(/[-:]/g, '').replace('T', '-')
  const filename = /filename="([^"]+)"/.exec(disposition)?.[1] ?? `pedidos-${stamp}.csv`
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  return { ok: true }
}

export async function fetchWorkspaceOrder(
  eventId: string,
  orderId: string,
): Promise<{ ok: true; order: Order } | { ok: false; error: string }> {
  const res = await browserFetch(workspacePath(eventId, `orders/${encodeURIComponent(orderId)}`), {
    headers: authHeadersJson(),
  })
  const body = (await res.json()) as { order?: Order; error?: string }
  if (!res.ok || !body.order) return { ok: false, error: body.error ?? 'Pedido no encontrado' }
  return { ok: true, order: body.order }
}

export type ProductScanSummaryItem = {
  name: string
  purchased: number
  scanned: number
}

export async function fetchProductScanSummary(
  eventId: string,
): Promise<{ ok: true; products: ProductScanSummaryItem[] } | { ok: false; error: string }> {
  const res = await browserFetch(workspacePath(eventId, 'products/scan-summary'), {
    headers: authHeadersJson(),
  })
  const body = (await res.json()) as { products?: ProductScanSummaryItem[]; error?: string }
  if (!res.ok) return { ok: false, error: body.error ?? 'Error al cargar escaneos' }
  return { ok: true, products: body.products ?? [] }
}

export async function patchOrderStatus(
  eventId: string,
  orderId: string,
  status: OrderStatus,
): Promise<{ ok: true; order: Order } | { ok: false; error: string }> {
  const res = await browserFetch(workspacePath(eventId, `orders/${orderId}`), {
    method: 'PATCH',
    headers: authHeadersJson(),
    body: JSON.stringify({ status }),
  })
  const body = (await res.json()) as { order?: Order; error?: string }
  if (!res.ok || !body.order) return { ok: false, error: body.error ?? 'No se pudo actualizar' }
  return { ok: true, order: body.order }
}

export async function previewQr(
  eventId: string,
  orderId: string,
): Promise<{ ok: true; order: Order } | { ok: false; error: string; alreadyScanned?: boolean; order?: Order }> {
  const res = await browserFetch(workspacePath(eventId, 'scan-qr/preview'), {
    method: 'POST',
    headers: authHeadersJson(),
    body: JSON.stringify({ order_id: orderId }),
  })
  const body = (await res.json()) as { order?: Order; error?: string }
  if (!res.ok) {
    const alreadyScanned = body.error === 'Este QR ya fue escaneado'
    return { ok: false, error: body.error ?? 'Error al escanear', alreadyScanned, order: body.order }
  }
  if (!body.order) return { ok: false, error: body.error ?? 'Error al escanear' }
  return { ok: true, order: body.order }
}

export async function scanQr(
  eventId: string,
  orderId: string,
  itemQuantities: Record<string, number>,
): Promise<{ ok: true; order: Order } | { ok: false; error: string; alreadyScanned?: boolean; order?: Order }> {
  const res = await browserFetch(workspacePath(eventId, 'scan-qr'), {
    method: 'POST',
    headers: authHeadersJson(),
    body: JSON.stringify({ order_id: orderId, item_quantities: itemQuantities }),
  })
  const body = (await res.json()) as { order?: Order; error?: string }
  if (!res.ok) {
    const alreadyScanned = body.error === 'Este QR ya fue escaneado'
    return { ok: false, error: body.error ?? 'Error al escanear', alreadyScanned, order: body.order }
  }
  if (!body.order) return { ok: false, error: body.error ?? 'Error al escanear' }
  return { ok: true, order: body.order }
}

export async function confirmCashPayment(
  eventId: string,
  orderId: string,
): Promise<{ ok: true; order: Order } | { ok: false; error: string }> {
  const res = await browserFetch(workspacePath(eventId, `orders/${orderId}/confirm-cash`), {
    method: 'POST',
    headers: authHeadersJson(),
  })
  const body = (await res.json()) as { order?: Order; error?: string }
  if (!res.ok || !body.order) return { ok: false, error: body.error ?? 'No se pudo confirmar el pago' }
  return { ok: true, order: body.order }
}

export async function fetchCategories(
  eventId: string,
  opts?: { page?: number; pageSize?: number },
): Promise<
  { ok: true; categories: WorkspaceCategory[]; pagination: PaginationMeta } | { ok: false; error: string }
> {
  const page = opts?.page ?? 1
  const pageSize = opts?.pageSize ?? 20
  const res = await browserFetch(workspacePath(eventId, 'categories', { page, page_size: pageSize }), {
    headers: authHeadersJson(),
  })
  const body = (await res.json()) as {
    categories?: WorkspaceCategory[]
    pagination?: Partial<PaginationMeta>
    error?: string
  }
  if (!res.ok) return { ok: false, error: body.error ?? 'Error' }
  const categories = body.categories ?? []
  return { ok: true, categories, pagination: readPagination(body, categories.length) }
}

/** Todas las categorías del evento (paginación automática en el cliente). */
export async function fetchAllCategories(
  eventId: string,
): Promise<{ ok: true; categories: WorkspaceCategory[] } | { ok: false; error: string }> {
  const pageSize = 100
  let page = 1
  const categories: WorkspaceCategory[] = []
  let total = 0
  for (;;) {
    const res = await fetchCategories(eventId, { page, pageSize })
    if (!res.ok) return res
    total = res.pagination.total
    categories.push(...res.categories)
    if (categories.length >= total || res.categories.length === 0) break
    page += 1
    if (page > 200) break
  }
  return { ok: true, categories }
}

export async function createCategory(
  eventId: string,
  name: string,
): Promise<{ ok: true; category: WorkspaceCategory } | { ok: false; error: string }> {
  const res = await browserFetch(workspacePath(eventId, 'categories'), {
    method: 'POST',
    headers: authHeadersJson(),
    body: JSON.stringify({ name }),
  })
  const body = (await res.json()) as { category?: WorkspaceCategory; error?: string }
  if (!res.ok || !body.category) return { ok: false, error: body.error ?? 'Error' }
  return { ok: true, category: body.category }
}

export async function patchCategory(
  eventId: string,
  categoryId: string,
  name: string,
): Promise<{ ok: true; category: WorkspaceCategory } | { ok: false; error: string }> {
  const res = await browserFetch(workspacePath(eventId, `categories/${categoryId}`), {
    method: 'PATCH',
    headers: authHeadersJson(),
    body: JSON.stringify({ name }),
  })
  const body = (await res.json()) as { category?: WorkspaceCategory; error?: string }
  if (!res.ok || !body.category) return { ok: false, error: body.error ?? 'Error' }
  return { ok: true, category: body.category }
}

export async function deleteCategory(
  eventId: string,
  categoryId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const res = await browserFetch(workspacePath(eventId, `categories/${categoryId}`), {
    method: 'DELETE',
    headers: authHeadersJson(),
  })
  const body = (await res.json()) as { error?: string }
  if (!res.ok) return { ok: false, error: body.error ?? 'Error' }
  return { ok: true }
}

export async function fetchWorkspaceProducts(
  eventId: string,
  opts?: { page?: number; pageSize?: number } & WorkspaceProductsFilters,
): Promise<
  | { ok: true; products: WorkspaceProduct[]; pagination: PaginationMeta; counts: WorkspaceProductsCounts | null }
  | { ok: false; error: string }
> {
  const page = opts?.page ?? 1
  const pageSize = opts?.pageSize ?? 20
  const query: Record<string, string | number | boolean | undefined> = { page, page_size: pageSize }
  const trimmedQ = opts?.q?.trim()
  if (trimmedQ) query.q = trimmedQ
  if (opts?.type) query.type = opts.type
  const cid = opts?.categoryId?.trim()
  if (cid) query.category_id = cid === 'none' ? 'none' : cid
  if (opts?.isActive !== undefined) query.is_active = opts.isActive
  if (opts?.noImage) query.no_image = true

  const res = await browserFetch(workspacePath(eventId, 'products', query), {
    headers: authHeadersJson(),
  })
  const body = (await res.json()) as {
    products?: WorkspaceProduct[]
    pagination?: Partial<PaginationMeta>
    counts?: WorkspaceProductsCounts
    error?: string
  }
  if (!res.ok) return { ok: false, error: body.error ?? 'Error' }
  const products = body.products ?? []
  return { ok: true, products, pagination: readPagination(body, products.length), counts: body.counts ?? null }
}

/** Guarda el orden de los productos recibidos (reparten las posiciones que ya ocupaban). */
export async function reorderWorkspaceProducts(
  eventId: string,
  ids: string[],
): Promise<{ ok: true } | { ok: false; error: string }> {
  const res = await browserFetch(workspacePath(eventId, 'products/reorder'), {
    method: 'POST',
    headers: authHeadersJson(),
    body: JSON.stringify({ ids }),
  })
  const body = (await res.json()) as { error?: string }
  if (!res.ok) return { ok: false, error: body.error ?? 'No se pudo guardar el orden' }
  return { ok: true }
}

/** Catálogo completo para pickers (paginación automática). */
export async function fetchAllWorkspaceProducts(
  eventId: string,
  filters?: WorkspaceProductsFilters,
): Promise<{ ok: true; products: WorkspaceProduct[] } | { ok: false; error: string }> {
  const pageSize = 100
  let page = 1
  const products: WorkspaceProduct[] = []
  let total = 0
  for (;;) {
    const res = await fetchWorkspaceProducts(eventId, { page, pageSize, ...filters })
    if (!res.ok) return res
    total = res.pagination.total
    products.push(...res.products)
    if (products.length >= total || res.products.length === 0) break
    page += 1
    if (page > 500) break
  }
  return { ok: true, products }
}

export async function createWorkspaceProduct(
  eventId: string,
  payload: {
    name: string
    price: number
    description?: string
    category_id?: string | null
    type?: 'single' | 'combo'
    lines?: { product_id: string; quantity: number }[]
    is_active?: boolean
  },
): Promise<{ ok: true; product: WorkspaceProduct } | { ok: false; error: string }> {
  const res = await browserFetch(workspacePath(eventId, 'products'), {
    method: 'POST',
    headers: authHeadersJson(),
    body: JSON.stringify(payload),
  })
  const body = (await res.json()) as { product?: WorkspaceProduct; error?: string }
  if (!res.ok || !body.product) return { ok: false, error: body.error ?? 'Error' }
  return { ok: true, product: body.product }
}

export async function patchWorkspaceProduct(
  eventId: string,
  productId: string,
  payload: Partial<{
    name: string
    description: string | null
    price: number
    is_active: boolean
    category_id: string | null
    lines: { product_id: string; quantity: number }[]
  }>,
): Promise<{ ok: true; product: WorkspaceProduct } | { ok: false; error: string }> {
  const res = await browserFetch(workspacePath(eventId, `products/${productId}`), {
    method: 'PATCH',
    headers: authHeadersJson(),
    body: JSON.stringify(payload),
  })
  const body = (await res.json()) as { product?: WorkspaceProduct; error?: string }
  if (!res.ok || !body.product) return { ok: false, error: body.error ?? 'Error' }
  return { ok: true, product: body.product }
}

export async function deleteWorkspaceProduct(
  eventId: string,
  productId: string,
): Promise<{ ok: true; pausedCombos: string[] } | { ok: false; error: string }> {
  const res = await browserFetch(workspacePath(eventId, `products/${productId}`), {
    method: 'DELETE',
    headers: authHeadersJson(),
  })
  const body = (await res.json()) as { error?: string; paused_combos?: string[] }
  if (!res.ok) return { ok: false, error: body.error ?? 'Error' }
  return { ok: true, pausedCombos: body.paused_combos ?? [] }
}

export type PaymentsSort = 'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc'

/** Cantidad y monto por estado del pago, con los filtros de canal y búsqueda aplicados. */
export type PaymentsSummary = Record<'approved' | 'pending' | 'rejected' | 'refunded', { count: number; amount: number }>

export async function fetchWorkspacePayments(
  eventId: string,
  opts?: {
    page?: number
    pageSize?: number
    /** Uno o varios estados (`approved`, `pending`, …). */
    status?: string | string[]
    channels?: string[]
    q?: string
    sort?: PaymentsSort
  },
): Promise<
  | { ok: true; payments: WorkspacePayment[]; pagination: PaginationMeta; summary: PaymentsSummary | null }
  | { ok: false; error: string }
> {
  const status = Array.isArray(opts?.status) ? opts.status.join(',') : opts?.status
  const query: Record<string, string | number | boolean | undefined> = {
    page: opts?.page ?? 1,
    page_size: opts?.pageSize ?? 20,
    status: status || undefined,
    channel: opts?.channels?.length ? opts.channels.join(',') : undefined,
    q: opts?.q?.trim() || undefined,
    sort: opts?.sort && opts.sort !== 'date_desc' ? opts.sort : undefined,
  }
  const res = await browserFetch(workspacePath(eventId, 'payments', query), {
    headers: authHeadersJson(),
  })
  const body = (await res.json()) as {
    payments?: WorkspacePayment[]
    pagination?: Partial<PaginationMeta>
    summary?: PaymentsSummary
    error?: string
  }
  if (!res.ok) return { ok: false, error: body.error ?? 'Error' }
  const payments = body.payments ?? []
  return { ok: true, payments, pagination: readPagination(body, payments.length), summary: body.summary ?? null }
}

export async function fetchAllApprovedPayments(
  eventId: string,
): Promise<{ ok: true; payments: WorkspacePayment[] } | { ok: false; error: string }> {
  const pageSize = 200
  let page = 1
  const payments: WorkspacePayment[] = []
  let total = 0
  for (;;) {
    const res = await fetchWorkspacePayments(eventId, { page, pageSize, status: 'approved' })
    if (!res.ok) return res
    total = res.pagination.total
    payments.push(...res.payments)
    if (payments.length >= total || res.payments.length === 0) break
    page += 1
    if (page > 50) break
  }
  return { ok: true, payments }
}

export async function fetchPickupPoints(
  eventId: string,
  opts?: { page?: number; pageSize?: number },
): Promise<
  { ok: true; pickup_points: WorkspacePickupPoint[]; pagination: PaginationMeta } | { ok: false; error: string }
> {
  const page = opts?.page ?? 1
  const pageSize = opts?.pageSize ?? 12
  const res = await browserFetch(workspacePath(eventId, 'pickup-points', { page, page_size: pageSize }), {
    headers: authHeadersJson(),
  })
  const body = (await res.json()) as {
    pickup_points?: WorkspacePickupPoint[]
    pagination?: Partial<PaginationMeta>
    error?: string
  }
  if (!res.ok) return { ok: false, error: body.error ?? 'Error' }
  const pickup_points = body.pickup_points ?? []
  return { ok: true, pickup_points, pagination: readPagination(body, pickup_points.length) }
}

export async function createPickupPoint(
  eventId: string,
  payload: { name: string; description?: string; is_active?: boolean; product_ids?: string[] },
): Promise<{ ok: true; pickup_point: WorkspacePickupPoint } | { ok: false; error: string }> {
  const res = await browserFetch(workspacePath(eventId, 'pickup-points'), {
    method: 'POST',
    headers: authHeadersJson(),
    body: JSON.stringify(payload),
  })
  const body = (await res.json()) as { pickup_point?: WorkspacePickupPoint; error?: string }
  if (!res.ok || !body.pickup_point) return { ok: false, error: body.error ?? 'Error' }
  return { ok: true, pickup_point: body.pickup_point }
}

export async function patchPickupPoint(
  eventId: string,
  pickupPointId: string,
  payload: Partial<{ name: string; description: string | null; is_active: boolean }>,
): Promise<{ ok: true; pickup_point: WorkspacePickupPoint } | { ok: false; error: string }> {
  const res = await browserFetch(workspacePath(eventId, `pickup-points/${pickupPointId}`), {
    method: 'PATCH',
    headers: authHeadersJson(),
    body: JSON.stringify(payload),
  })
  const body = (await res.json()) as { pickup_point?: WorkspacePickupPoint; error?: string }
  if (!res.ok || !body.pickup_point) return { ok: false, error: body.error ?? 'Error' }
  return { ok: true, pickup_point: body.pickup_point }
}

export async function deletePickupPoint(
  eventId: string,
  pickupPointId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const res = await browserFetch(workspacePath(eventId, `pickup-points/${pickupPointId}`), {
    method: 'DELETE',
    headers: authHeadersJson(),
  })
  const body = (await res.json()) as { error?: string }
  if (!res.ok) return { ok: false, error: body.error ?? 'Error' }
  return { ok: true }
}

export async function putPickupPointProducts(
  eventId: string,
  pickupPointId: string,
  productIds: string[],
): Promise<{ ok: true; pickup_point: WorkspacePickupPoint } | { ok: false; error: string }> {
  const res = await browserFetch(workspacePath(eventId, `pickup-points/${pickupPointId}/products`), {
    method: 'PUT',
    headers: authHeadersJson(),
    body: JSON.stringify({ product_ids: productIds }),
  })
  const body = (await res.json()) as { pickup_point?: WorkspacePickupPoint; error?: string }
  if (!res.ok || !body.pickup_point) return { ok: false, error: body.error ?? 'Error' }
  return { ok: true, pickup_point: body.pickup_point }
}

export async function fetchCatalogBlocks(
  eventId: string,
): Promise<{ ok: true; blocks: WorkspaceCatalogBlock[] } | { ok: false; error: string }> {
  const res = await browserFetch(workspacePath(eventId, 'blocks'), {
    headers: authHeadersJson(),
  })
  const body = (await res.json()) as { blocks?: WorkspaceCatalogBlock[]; error?: string }
  if (!res.ok) return { ok: false, error: body.error ?? 'Error' }
  return { ok: true, blocks: body.blocks ?? [] }
}

/** Guarda el orden de los bloques (el mismo en que aparecen arriba del catálogo). */
export async function reorderCatalogBlocks(
  eventId: string,
  ids: string[],
): Promise<{ ok: true } | { ok: false; error: string }> {
  const res = await browserFetch(workspacePath(eventId, 'blocks/reorder'), {
    method: 'POST',
    headers: authHeadersJson(),
    body: JSON.stringify({ ids }),
  })
  const body = (await res.json()) as { error?: string }
  if (!res.ok) return { ok: false, error: body.error ?? 'No se pudo guardar el orden' }
  return { ok: true }
}

export async function createCatalogBlock(
  eventId: string,
  payload: { title: string; is_active?: boolean; product_ids?: string[] },
): Promise<{ ok: true; block: WorkspaceCatalogBlock } | { ok: false; error: string }> {
  const res = await browserFetch(workspacePath(eventId, 'blocks'), {
    method: 'POST',
    headers: authHeadersJson(),
    body: JSON.stringify(payload),
  })
  const body = (await res.json()) as { block?: WorkspaceCatalogBlock; error?: string }
  if (!res.ok || !body.block) return { ok: false, error: body.error ?? 'Error' }
  return { ok: true, block: body.block }
}

export async function patchCatalogBlock(
  eventId: string,
  blockId: string,
  payload: Partial<{ title: string; is_active: boolean }>,
): Promise<{ ok: true; block: WorkspaceCatalogBlock } | { ok: false; error: string }> {
  const res = await browserFetch(workspacePath(eventId, `blocks/${blockId}`), {
    method: 'PATCH',
    headers: authHeadersJson(),
    body: JSON.stringify(payload),
  })
  const body = (await res.json()) as { block?: WorkspaceCatalogBlock; error?: string }
  if (!res.ok || !body.block) return { ok: false, error: body.error ?? 'Error' }
  return { ok: true, block: body.block }
}

export async function deleteCatalogBlock(
  eventId: string,
  blockId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const res = await browserFetch(workspacePath(eventId, `blocks/${blockId}`), {
    method: 'DELETE',
    headers: authHeadersJson(),
  })
  const body = (await res.json()) as { error?: string }
  if (!res.ok) return { ok: false, error: body.error ?? 'Error' }
  return { ok: true }
}

export async function putCatalogBlockProducts(
  eventId: string,
  blockId: string,
  productIds: string[],
): Promise<{ ok: true; block: WorkspaceCatalogBlock } | { ok: false; error: string }> {
  const res = await browserFetch(workspacePath(eventId, `blocks/${blockId}/products`), {
    method: 'PUT',
    headers: authHeadersJson(),
    body: JSON.stringify({ product_ids: productIds }),
  })
  const body = (await res.json()) as { block?: WorkspaceCatalogBlock; error?: string }
  if (!res.ok || !body.block) return { ok: false, error: body.error ?? 'Error' }
  return { ok: true, block: body.block }
}

export async function fetchTickets(
  eventId: string,
): Promise<{ ok: true; tickets: WorkspaceTicket[] } | { ok: false; error: string }> {
  const res = await browserFetch(workspacePath(eventId, 'tickets'), {
    headers: authHeadersJson(),
  })
  const body = (await res.json()) as { tickets?: WorkspaceTicket[]; error?: string }
  if (!res.ok) return { ok: false, error: body.error ?? 'Error' }
  return { ok: true, tickets: body.tickets ?? [] }
}

export async function createTicket(
  eventId: string,
  payload: { name: string; price: number; description?: string; stock?: number | null; is_active?: boolean },
): Promise<{ ok: true; ticket: WorkspaceTicket } | { ok: false; error: string }> {
  const res = await browserFetch(workspacePath(eventId, 'tickets'), {
    method: 'POST',
    headers: authHeadersJson(),
    body: JSON.stringify(payload),
  })
  const body = (await res.json()) as { ticket?: WorkspaceTicket; error?: string }
  if (!res.ok || !body.ticket) return { ok: false, error: body.error ?? 'Error' }
  return { ok: true, ticket: body.ticket }
}

export async function patchTicket(
  eventId: string,
  ticketId: string,
  payload: Partial<{ name: string; price: number; description: string; stock: number | null; is_active: boolean }>,
): Promise<{ ok: true; ticket: WorkspaceTicket } | { ok: false; error: string }> {
  const res = await browserFetch(workspacePath(eventId, `tickets/${ticketId}`), {
    method: 'PATCH',
    headers: authHeadersJson(),
    body: JSON.stringify(payload),
  })
  const body = (await res.json()) as { ticket?: WorkspaceTicket; error?: string }
  if (!res.ok || !body.ticket) return { ok: false, error: body.error ?? 'Error' }
  return { ok: true, ticket: body.ticket }
}

/** Guarda el orden de los tickets (el mismo que ve el comprador). */
export async function reorderTickets(
  eventId: string,
  ids: string[],
): Promise<{ ok: true } | { ok: false; error: string }> {
  const res = await browserFetch(workspacePath(eventId, 'tickets/reorder'), {
    method: 'POST',
    headers: authHeadersJson(),
    body: JSON.stringify({ ids }),
  })
  const body = (await res.json()) as { error?: string }
  if (!res.ok) return { ok: false, error: body.error ?? 'No se pudo guardar el orden' }
  return { ok: true }
}

export async function deleteTicket(
  eventId: string,
  ticketId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const res = await browserFetch(workspacePath(eventId, `tickets/${ticketId}`), {
    method: 'DELETE',
    headers: authHeadersJson(),
  })
  const body = (await res.json()) as { error?: string }
  if (!res.ok) return { ok: false, error: body.error ?? 'Error' }
  return { ok: true }
}

export type WorkspaceProductPromotion = {
  id: string
  product_id: string
  badge_label: string
  promo_price: number | null
  is_active: boolean
  starts_at: string | null
  ends_at: string | null
}

export async function fetchWorkspaceProductPromotions(
  eventId: string,
): Promise<{ ok: true; promotions: WorkspaceProductPromotion[] } | { ok: false; error: string }> {
  const res = await browserFetch(workspacePath(eventId, 'product-promotions'), {
    headers: authHeadersJson(),
  })
  const body = (await res.json()) as { promotions?: WorkspaceProductPromotion[]; error?: string }
  if (!res.ok) return { ok: false, error: body.error ?? 'Error' }
  return { ok: true, promotions: body.promotions ?? [] }
}

export async function upsertWorkspaceProductPromotion(
  eventId: string,
  productId: string,
  payload: {
    badge_label: string
    promo_price?: number | null
    is_active?: boolean
    starts_at?: string | null
    ends_at?: string | null
  },
): Promise<{ ok: true; promotion: WorkspaceProductPromotion } | { ok: false; error: string }> {
  const res = await browserFetch(workspacePath(eventId, `product-promotions/${productId}`), {
    method: 'PUT',
    headers: authHeadersJson(),
    body: JSON.stringify(payload),
  })
  const body = (await res.json()) as { promotion?: WorkspaceProductPromotion; error?: string }
  if (!res.ok || !body.promotion) return { ok: false, error: body.error ?? 'Error' }
  return { ok: true, promotion: body.promotion }
}

export async function deleteWorkspaceProductPromotion(
  eventId: string,
  productId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const res = await browserFetch(workspacePath(eventId, `product-promotions/${productId}`), {
    method: 'DELETE',
    headers: authHeadersJson(),
  })
  const body = (await res.json()) as { error?: string }
  if (!res.ok) return { ok: false, error: body.error ?? 'Error' }
  return { ok: true }
}
