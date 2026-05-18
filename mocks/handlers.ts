/**
 * Handlers de mock para el proxy `/api/backend/[[...path]]`.
 * Cada entrada: { method, pattern, handler }.
 *
 * `pattern` puede ser una regexp o una función que recibe los segmentos del path.
 */
import {
  MOCK_EVENT_ID,
  mockCategories,
  mockDashboard,
  mockEvent,
  mockOrders,
  mockPayments,
  mockPickupPoints,
  mockProducts,
  mockStorefront,
  mockUser,
} from './data'

type MockHandler = (segments: string[], method: string, body?: unknown) => unknown

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
    match: (s) => s[0] === 'events' && s[2] === 'products' && !s[3],
    handler: () => ({
      products: mockProducts,
      pagination: { page: 1, page_size: 100, total: mockProducts.length },
    }),
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

  // ── Payments ──────────────────────────────────────────────────────────────
  {
    method: 'GET',
    match: (s) => s[0] === 'events' && s[2] === 'payments',
    handler: () => ({
      payments: mockPayments,
      pagination: { page: 1, page_size: 20, total: mockPayments.length },
    }),
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
): { status: number; json: unknown } | null {
  const route = routes.find(
    (r) => (r.method === '*' || r.method === method) && r.match(segments, method),
  )
  if (!route) {
    console.warn(`[MOCK] Sin handler para ${method} /${segments.join('/')}`)
    return { status: 404, json: { error: `Mock: ruta no encontrada: ${method} /${segments.join('/')}` } }
  }
  try {
    const data = route.handler(segments, method, body)
    return { status: 200, json: data }
  } catch (err) {
    console.error('[MOCK] Error en handler:', err)
    return { status: 500, json: { error: 'Error en mock handler' } }
  }
}
