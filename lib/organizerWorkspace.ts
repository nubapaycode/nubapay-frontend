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

export type DashboardSummary = {
  total_revenue: number
  order_count: number
  active_orders: number
  delivered_orders: number
  by_status: Record<OrderStatus, number>
  hourly: { hour: string; revenue: number }[]
  payment_breakdown: { key: 'mp' | 'cash' | 'transfer'; count: number; revenue: number }[]
  top_products: { name: string; quantity: number; revenue: number }[]
}

export type WorkspacePayment = {
  id: string
  order_id: string
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
}

function readPagination(body: { pagination?: Partial<PaginationMeta> }, itemCount: number): PaginationMeta {
  const p = body.pagination
  if (p && typeof p.page === 'number' && typeof p.page_size === 'number' && typeof p.total === 'number') {
    return { page: p.page, page_size: p.page_size, total: p.total }
  }
  return { page: 1, page_size: Math.max(itemCount, 1), total: itemCount }
}

export async function fetchEventDashboard(eventId: string): Promise<
  { ok: true; data: DashboardSummary } | { ok: false; error: string }
> {
  const res = await browserFetch(workspacePath(eventId, 'dashboard'), {
    headers: authHeadersJson(),
  })
  const body = (await res.json()) as DashboardSummary & { error?: string }
  if (!res.ok) return { ok: false, error: body.error ?? 'Error al cargar métricas' }
  return { ok: true, data: body as DashboardSummary }
}

export type WorkspaceOrdersFilters = {
  q?: string
  status?: string
  paymentStatus?: string
}

export async function fetchWorkspaceOrders(
  eventId: string,
  opts?: { page?: number; pageSize?: number } & WorkspaceOrdersFilters,
): Promise<
  { ok: true; orders: Order[]; pagination: PaginationMeta } | { ok: false; error: string }
> {
  const page = opts?.page ?? 1
  const pageSize = opts?.pageSize ?? 40
  const query: Record<string, string | number | boolean | undefined> = { page, page_size: pageSize }
  const trimmedQ = opts?.q?.trim()
  if (trimmedQ) query.q = trimmedQ
  const st = opts?.status?.trim()
  if (st) query.status = st
  const ps = opts?.paymentStatus?.trim()
  if (ps) query.payment_status = ps

  const res = await browserFetch(workspacePath(eventId, 'orders', query), {
    headers: authHeadersJson(),
  })
  const body = (await res.json()) as { orders?: Order[]; pagination?: Partial<PaginationMeta>; error?: string }
  if (!res.ok) return { ok: false, error: body.error ?? 'Error al cargar pedidos' }
  const orders = body.orders ?? []
  return { ok: true, orders, pagination: readPagination(body, orders.length) }
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

export async function scanQr(
  eventId: string,
  orderId: string,
): Promise<{ ok: true; order: Order } | { ok: false; error: string }> {
  const res = await browserFetch(workspacePath(eventId, 'scan-qr'), {
    method: 'POST',
    headers: authHeadersJson(),
    body: JSON.stringify({ order_id: orderId }),
  })
  const body = (await res.json()) as { order?: Order; error?: string }
  if (!res.ok || !body.order) return { ok: false, error: body.error ?? 'Error al escanear' }
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
  { ok: true; products: WorkspaceProduct[]; pagination: PaginationMeta } | { ok: false; error: string }
> {
  const page = opts?.page ?? 1
  const pageSize = opts?.pageSize ?? 20
  const query: Record<string, string | number | boolean | undefined> = { page, page_size: pageSize }
  const trimmedQ = opts?.q?.trim()
  if (trimmedQ) query.q = trimmedQ
  if (opts?.type) query.type = opts.type
  const cid = opts?.categoryId?.trim()
  if (cid) query.category_id = cid === 'none' ? 'none' : cid

  const res = await browserFetch(workspacePath(eventId, 'products', query), {
    headers: authHeadersJson(),
  })
  const body = (await res.json()) as { products?: WorkspaceProduct[]; pagination?: Partial<PaginationMeta>; error?: string }
  if (!res.ok) return { ok: false, error: body.error ?? 'Error' }
  const products = body.products ?? []
  return { ok: true, products, pagination: readPagination(body, products.length) }
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

export async function fetchWorkspacePayments(
  eventId: string,
  opts?: { page?: number; pageSize?: number },
): Promise<
  { ok: true; payments: WorkspacePayment[]; pagination: PaginationMeta } | { ok: false; error: string }
> {
  const page = opts?.page ?? 1
  const pageSize = opts?.pageSize ?? 20
  const res = await browserFetch(workspacePath(eventId, 'payments', { page, page_size: pageSize }), {
    headers: authHeadersJson(),
  })
  const body = (await res.json()) as {
    payments?: WorkspacePayment[]
    pagination?: Partial<PaginationMeta>
    error?: string
  }
  if (!res.ok) return { ok: false, error: body.error ?? 'Error' }
  const payments = body.payments ?? []
  return { ok: true, payments, pagination: readPagination(body, payments.length) }
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
