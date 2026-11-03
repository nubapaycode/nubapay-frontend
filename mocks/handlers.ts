/**
 * Handlers de mock para el proxy `/api/backend/[[...path]]`.
 * Cada entrada: { method, pattern, handler }.
 *
 * `pattern` puede ser una regexp o una función que recibe los segmentos del path.
 */
import {
  MOCK_EVENT_ID,
  mockBlocks,
  mockCategories,
  mockDashboard,
  mockEvent,
  mockOrders,
  mockPayments,
  mockPickupPoints,
  mockProducts,
  mockStorefront,
  mockTickets,
  mockUser,
} from './data'

type MockHandler = (segments: string[], method: string, body?: unknown, query?: URLSearchParams) => unknown

type MockRoute = {
  method: string | '*'
  match: (segments: string[], method: string) => boolean
  handler: MockHandler
}

const routes: MockRoute[] = [
  // ── Auth ──────────────────────────────────────────────────────────────────
  {
    method: 'GET',
    match: (s) => s[0] === 'auth' && s[1] === 'me',
    handler: () => ({ user: mockUser }),
  },
  {
    method: 'POST',
    match: (s) => s[0] === 'auth' && s[1] === 'login',
    handler: () => ({
      token: 'mock-jwt-token-0000',
      user: mockUser,
    }),
  },

  // ── Events ────────────────────────────────────────────────────────────────
  {
    method: 'GET',
    match: (s) => s[0] === 'events' && !s[1],
    handler: () => ({
      events: [mockEvent],
      pagination: { page: 1, page_size: 20, total: 1 },
    }),
  },
  {
    method: 'GET',
    match: (s) => s[0] === 'events' && !!s[1] && !s[2],
    handler: () => ({ event: mockEvent }),
  },

  // ── Staff ─────────────────────────────────────────────────────────────────
  {
    method: 'GET',
    match: (s) => s[0] === 'events' && !!s[1] && s[2] === 'staff',
    handler: () => ({
      staff: [
        {
          id: 'staff-1',
          user_id: 'user-001',
          email: 'organizador@demo.com',
          name: 'Demo Organizador',
          role: 'admin',
          tools: {
            dashboard: true,
            storefront: true,
            products: true,
            scanner: true,
            orders: true,
            pickup_points: true,
            payments: true,
          },
        },
      ],
    }),
  },

  // ── Dashboard ─────────────────────────────────────────────────────────────
  {
    method: 'GET',
    match: (s) => s[0] === 'events' && s[2] === 'dashboard',
    handler: () => mockDashboard,
  },

  // ── Orders ────────────────────────────────────────────────────────────────
  {
    method: 'GET',
    match: (s) => s[0] === 'events' && s[2] === 'orders' && !s[3],
    handler: () => ({
      orders: mockOrders,
      pagination: { page: 1, page_size: 40, total: mockOrders.length },
      status_counts: {
        unredeemed: mockOrders.filter((o) => ['pending', 'paid', 'preparing', 'ready'].includes(o.status)).length,
        partially_delivered: mockOrders.filter((o) => (o.status as string) === 'partially_delivered').length,
        delivered: mockOrders.filter((o) => o.status === 'delivered').length,
        cancelled: mockOrders.filter((o) => (o.status as string) === 'cancelled').length,
      },
      summary: {
        revenue: mockOrders.filter((o) => (o.status as string) !== 'cancelled').reduce((a, o) => a + o.total, 0),
        units: mockOrders.reduce((a, o) => a + o.items.reduce((s, i) => s + i.quantity, 0), 0),
        redeemed_units: mockOrders.filter((o) => o.status === 'delivered').reduce((a, o) => a + o.items.reduce((s, i) => s + i.quantity, 0), 0),
      },
    }),
  },
  {
    method: 'GET',
    match: (s) => s[0] === 'events' && s[2] === 'orders' && !!s[3] && !s[4],
    handler: (s) => {
      const order = mockOrders.find((o) => o.id === s[3]) ?? mockOrders[0]
      return { order }
    },
  },
  {
    method: 'PATCH',
    match: (s) => s[0] === 'events' && s[2] === 'orders' && !!s[3] && s[4] === 'status',
    handler: (s, _m, body) => {
      const order = mockOrders.find((o) => o.id === s[3]) ?? mockOrders[0]
      const newStatus = (body as { status?: string })?.status ?? order.status
      return { order: { ...order, status: newStatus } }
    },
  },

  // ── Categories ────────────────────────────────────────────────────────────
  {
    method: 'GET',
    match: (s) => s[0] === 'events' && s[2] === 'categories' && !s[3],
    handler: () => ({
      categories: mockCategories,
      pagination: { page: 1, page_size: 100, total: mockCategories.length },
    }),
  },
  {
    method: 'POST',
    match: (s) => s[0] === 'events' && s[2] === 'categories' && !s[3],
    handler: (_s, _m, body) => {
      const b = body as { name?: string }
      const newCat = { id: `cat-new-${Date.now()}`, name: b?.name ?? 'Nueva', sort_order: 99, is_active: true }
      return { category: newCat }
    },
  },
  {
    method: 'PATCH',
    match: (s) => s[0] === 'events' && s[2] === 'categories' && !!s[3],
    handler: (s, _m, body) => {
      const cat = mockCategories.find((c) => c.id === s[3]) ?? mockCategories[0]
      return { category: { ...cat, ...(body as object) } }
    },
  },
  {
    method: 'DELETE',
    match: (s) => s[0] === 'events' && s[2] === 'categories' && !!s[3],
    handler: () => ({ ok: true }),
  },

  // ── Products ──────────────────────────────────────────────────────────────
  {
    method: 'GET',
    match: (s) => s[0] === 'events' && s[2] === 'products' && s[3] === 'scan-summary',
    handler: () => ({
      products: [
        { name: 'Cerveza Rubia 500ml', purchased: 412, scanned: 371 },
        { name: 'Fernet con Coca', purchased: 268, scanned: 240 },
        { name: 'Hamburguesa Clásica', purchased: 191, scanned: 158 },
        { name: 'Combo Clásico', purchased: 122, scanned: 97 },
        { name: 'Agua Mineral 500ml', purchased: 118, scanned: 118 },
        { name: 'Papas Fritas', purchased: 84, scanned: 52 },
      ],
    }),
  },
  {
    method: 'GET',
    match: (s) => s[0] === 'events' && s[2] === 'products' && !s[3],
    handler: (_s, _m, _b, query) => {
      const type = query?.get('type')
      const categoryId = query?.get('category_id')
      const products = mockProducts.filter(
        (p) => (!type || p.type === type) && (!categoryId || p.category_id === categoryId),
      )
      return { products, pagination: { page: 1, page_size: 100, total: products.length } }
    },
  },
  {
    method: 'POST',
    match: (s) => s[0] === 'events' && s[2] === 'products' && !s[3],
    handler: (_s, _m, body) => {
      const b = body as Record<string, unknown>
      const newProduct = {
        id: `prod-new-${Date.now()}`,
        event_id: MOCK_EVENT_ID,
        category_id: null,
        category_name: null,
        name: b?.name ?? 'Nuevo Producto',
        description: b?.description ?? '',
        price: b?.price ?? 0,
        currency: 'ARS',
        type: 'single' as const,
        is_active: true,
        image_url: null,
        combo_lines: [],
      }
      return { product: newProduct }
    },
  },
  {
    method: 'PATCH',
    match: (s) => s[0] === 'events' && s[2] === 'products' && !!s[3] && !s[4],
    handler: (s, _m, body) => {
      const product = mockProducts.find((p) => p.id === s[3]) ?? mockProducts[0]
      return { product: { ...product, ...(body as object) } }
    },
  },
  {
    method: 'DELETE',
    match: (s) => s[0] === 'events' && s[2] === 'products' && !!s[3] && !s[4],
    handler: () => ({ ok: true }),
  },

  // ── Product promotions ────────────────────────────────────────────────────
  {
    method: 'GET',
    match: (s) => s[0] === 'events' && s[2] === 'products' && s[4] === 'promotion',
    handler: () => ({ promotion: null }),
  },
  {
    method: 'GET',
    match: (s) => s[0] === 'events' && s[2] === 'product-promotions',
    handler: () => ({ promotions: [] }),
  },

  // ── Scanner ───────────────────────────────────────────────────────────────
  {
    method: 'POST',
    match: (s) => s[0] === 'events' && s[2] === 'scan-qr' && s[3] === 'preview',
    handler: (_s, _m, body) => {
      const id = (body as { order_id?: string })?.order_id
      return { order: mockOrders.find((o) => o.id === id) ?? mockOrders[0] }
    },
  },
  {
    method: 'POST',
    match: (s) => s[0] === 'events' && s[2] === 'scan-qr' && !s[3],
    handler: (_s, _m, body) => {
      const b = body as { order_id?: string; item_quantities?: Record<string, number> }
      const order = mockOrders.find((o) => o.id === b?.order_id) ?? mockOrders[0]
      const qty = b?.item_quantities ?? {}
      const items = order.items.map((i) => {
        const add = qty[i.id] ?? 0
        const redeemedQuantity = Math.min(i.quantity, (i.redeemedQuantity ?? 0) + add)
        return { ...i, redeemedQuantity, redeemedAt: add > 0 ? new Date().toISOString() : i.redeemedAt }
      })
      const done = items.every((i) => i.redeemedQuantity >= i.quantity)
      return { order: { ...order, items, status: done ? 'delivered' : 'partially_delivered' } }
    },
  },

  // ── Catalog blocks ────────────────────────────────────────────────────────
  {
    method: 'GET',
    match: (s) => s[0] === 'events' && s[2] === 'blocks' && !s[3],
    handler: () => ({ blocks: mockBlocks }),
  },

  // ── Tickets ───────────────────────────────────────────────────────────────
  {
    method: 'GET',
    match: (s) => s[0] === 'events' && s[2] === 'tickets' && !s[3],
    handler: () => ({ tickets: mockTickets }),
  },

  // ── Payments ──────────────────────────────────────────────────────────────
  {
    method: 'GET',
    match: (s) => s[0] === 'events' && s[2] === 'payments',
    handler: (_s, _m, _b, query) => {
      const status = query?.get('status')
      const payments = status ? mockPayments.filter((p) => p.status === status) : mockPayments
      return { payments, pagination: { page: 1, page_size: 20, total: payments.length } }
    },
  },

  // ── Pickup points ─────────────────────────────────────────────────────────
  {
    method: 'GET',
    match: (s) => s[0] === 'events' && s[2] === 'pickup-points' && !s[3],
    handler: () => ({
      pickup_points: mockPickupPoints,
      pagination: { page: 1, page_size: 100, total: mockPickupPoints.length },
    }),
  },
  {
    method: 'POST',
    match: (s) => s[0] === 'events' && s[2] === 'pickup-points' && !s[3],
    handler: (_s, _m, body) => {
      const b = body as Record<string, unknown>
      return {
        pickup_point: {
          id: `pp-new-${Date.now()}`,
          event_id: MOCK_EVENT_ID,
          name: b?.name ?? 'Nuevo punto',
          description: b?.description ?? '',
          is_active: true,
          products: [],
        },
      }
    },
  },
  {
    method: 'PATCH',
    match: (s) => s[0] === 'events' && s[2] === 'pickup-points' && !!s[3] && !s[4],
    handler: (s, _m, body) => {
      const pp = mockPickupPoints.find((p) => p.id === s[3]) ?? mockPickupPoints[0]
      return { pickup_point: { ...pp, ...(body as object) } }
    },
  },
  {
    method: 'DELETE',
    match: (s) => s[0] === 'events' && s[2] === 'pickup-points' && !!s[3] && !s[4],
    handler: () => ({ ok: true }),
  },
  {
    method: 'PUT',
    match: (s) => s[0] === 'events' && s[2] === 'pickup-points' && !!s[3] && s[4] === 'products',
    handler: () => ({ ok: true }),
  },

  // ── Storefront (buyer) ────────────────────────────────────────────────────
  {
    method: 'GET',
    match: (s) => s[0] === 'catalog' && s[1] === 'storefront' && !!s[2] && !s[3],
    handler: () => mockStorefront,
  },
  {
    method: 'POST',
    match: (s) => s[0] === 'catalog' && s[1] === 'storefront' && !!s[2] && s[3] === 'orders',
    handler: () => ({
      order_id: `order-mock-${Date.now()}`,
      status: 'pending',
      checkout_url: null,
    }),
  },
  {
    method: 'GET',
    match: (s) => s[0] === 'catalog' && s[1] === 'orders' && !!s[2],
    handler: (s) => {
      const order = mockOrders.find((o) => o.id === s[2]) ?? mockOrders[0]
      return {
        order_id: order.id,
        order_number: order.order_number,
        status: order.status,
        payment_status: order.payment_status,
        total_amount: order.total,
        customer_name: order.customer_name,
        payment_method: order.payment_method,
        checkout_url: null,
        items: order.items.map((i) => ({
          product_id: i.product_id,
          product_name: i.name,
          unit_price: i.price,
          quantity: i.quantity,
          subtotal: i.subtotal,
        })),
        created_at: order.created_at,
      }
    },
  },

  // ── Tenant / partner ──────────────────────────────────────────────────────
  {
    method: 'GET',
    match: (s) => s[0] === 'me' && s[1] === 'tenant',
    handler: () => ({
      tenant: {
        id: 'tenant-001',
        subdomain: 'demo',
        name: 'Demo Corp',
        partner: null,
        domains: [],
      },
    }),
  },
  {
    method: 'GET',
    match: (s) => s[0] === 'public' && s[1] === 'tenant-by-host',
    handler: () => ({
      tenant: {
        id: 'tenant-001',
        subdomain: 'demo',
        name: 'Demo Corp',
        theme: null,
      },
    }),
  },

  // ── Health ────────────────────────────────────────────────────────────────
  {
    method: 'GET',
    match: (s) => s[0] === 'health',
    handler: () => ({ status: 'ok', service: 'mock', database: { configured: true, ok: true } }),
  },
]

/**
 * Resuelve la respuesta mock para una petición dada.
 * Devuelve `null` si ninguna ruta coincide.
 */
export function resolveMock(
  segments: string[],
  method: string,
  body?: unknown,
  query?: URLSearchParams,
): { status: number; json: unknown } | null {
  const route = routes.find(
    (r) => (r.method === '*' || r.method === method) && r.match(segments, method),
  )
  if (!route) {
    console.warn(`[MOCK] Sin handler para ${method} /${segments.join('/')}`)
    return { status: 404, json: { error: `Mock: ruta no encontrada: ${method} /${segments.join('/')}` } }
  }
  try {
    const data = route.handler(segments, method, body, query)
    return { status: 200, json: data }
  } catch (err) {
    console.error('[MOCK] Error en handler:', err)
    return { status: 500, json: { error: 'Error en mock handler' } }
  }
}
