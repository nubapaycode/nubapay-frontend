/**
 * Datos de prueba para desarrollo sin backend.
 * Activar con: NEXT_PUBLIC_MOCK_API=true en .env.local
 */

export const MOCK_EVENT_ID = 'aaaaaaaa-0000-0000-0000-000000000001'
export const MOCK_CATALOG_SLUG = 'demo-fest-2026'

export const mockUser = {
  id: 'user-001',
  email: 'organizador@demo.com',
  name: 'Demo Organizador',
  tenant_subdomain: 'demo',
  partner: null,
  staff_memberships: [
    { event_id: MOCK_EVENT_ID, role: 'admin' },
  ],
}

export const mockEvent = {
  id: MOCK_EVENT_ID,
  name: 'Demo Fest 2026',
  slug: MOCK_CATALOG_SLUG,
  description: 'Evento de demostración con todos los tipos de productos.',
  venue: 'Estadio Centenario, Montevideo',
  cover_image_url: null,
  starts_at: '2026-07-15T18:00:00Z',
  ends_at: null,
  status: 'active',
  is_active: true,
  membership: 'owner',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  user_id: 'user-001',
}

export const mockCategories = [
  { id: 'cat-1', name: 'Bebidas', sort_order: 0, is_active: true },
  { id: 'cat-2', name: 'Comidas', sort_order: 1, is_active: true },
  { id: 'cat-3', name: 'Snacks', sort_order: 2, is_active: true },
]

export const mockProducts = [
  {
    id: 'prod-1',
    event_id: MOCK_EVENT_ID,
    category_id: 'cat-1',
    category_name: 'Bebidas',
    name: 'Cerveza Artesanal 500ml',
    description: 'IPA clásica, bien fría',
    price: 850,
    currency: 'ARS',
    type: 'single' as const,
    is_active: true,
    image_url: null,
    combo_lines: [],
  },
  {
    id: 'prod-2',
    event_id: MOCK_EVENT_ID,
    category_id: 'cat-1',
    category_name: 'Bebidas',
    name: 'Gaseosa 500ml',
    description: 'Coca-Cola, Sprite o Fanta',
    price: 450,
    currency: 'ARS',
    type: 'single' as const,
    is_active: true,
    image_url: null,
    combo_lines: [],
  },
  {
    id: 'prod-3',
    event_id: MOCK_EVENT_ID,
    category_id: 'cat-1',
    category_name: 'Bebidas',
    name: 'Agua Mineral 500ml',
    description: 'Con o sin gas',
    price: 300,
    currency: 'ARS',
    type: 'single' as const,
    is_active: true,
    image_url: null,
    combo_lines: [],
  },
  {
    id: 'prod-4',
    event_id: MOCK_EVENT_ID,
    category_id: 'cat-2',
    category_name: 'Comidas',
    name: 'Hamburguesa Clásica',
    description: 'Pan brioche, carne 180g, lechuga, tomate',
    price: 2800,
    currency: 'ARS',
    type: 'single' as const,
    is_active: true,
    image_url: null,
    combo_lines: [],
  },
  {
    id: 'prod-5',
    event_id: MOCK_EVENT_ID,
    category_id: 'cat-2',
    category_name: 'Comidas',
    name: 'Choripán',
    description: 'Con chimichurri casero',
    price: 1500,
    currency: 'ARS',
    type: 'single' as const,
    is_active: true,
    image_url: null,
    combo_lines: [],
  },
  {
    id: 'prod-6',
    event_id: MOCK_EVENT_ID,
    category_id: 'cat-3',
    category_name: 'Snacks',
    name: 'Papas Fritas',
    description: 'Porción grande con sal y ketchup',
    price: 900,
    currency: 'ARS',
    type: 'single' as const,
    is_active: true,
    image_url: null,
    combo_lines: [],
  },
  {
    id: 'combo-1',
    event_id: MOCK_EVENT_ID,
    category_id: null,
    category_name: null,
    name: 'Combo Hamburguesa + Bebida',
    description: 'Hamburguesa Clásica + Gaseosa 500ml',
    price: 2900,
    currency: 'ARS',
    type: 'combo' as const,
    is_active: true,
    image_url: null,
    combo_lines: [
      { product_id: 'prod-4', quantity: 1, name: 'Hamburguesa Clásica' },
      { product_id: 'prod-2', quantity: 1, name: 'Gaseosa 500ml' },
    ],
  },
  {
    id: 'combo-2',
    event_id: MOCK_EVENT_ID,
    category_id: null,
    category_name: null,
    name: 'Combo Familiar',
    description: '2 Hamburguesas + 2 Gaseosas + Papas',
    price: 7500,
    currency: 'ARS',
    type: 'combo' as const,
    is_active: true,
    image_url: null,
    combo_lines: [
      { product_id: 'prod-4', quantity: 2, name: 'Hamburguesa Clásica' },
      { product_id: 'prod-2', quantity: 2, name: 'Gaseosa 500ml' },
      { product_id: 'prod-6', quantity: 1, name: 'Papas Fritas' },
    ],
  },
]

const makeMockOrder = (
  n: number,
  status: 'pending' | 'preparing' | 'ready' | 'delivered',
  paymentMethod: 'mp' | 'cash' | 'transfer' = 'mp',
) => ({
  id: `order-${String(n).padStart(8, '0')}-0000-0000-000000000001`,
  order_number: n,
  event_id: MOCK_EVENT_ID,
  customer_name: ['María García', 'Juan López', 'Ana Martínez', 'Carlos Rodríguez', 'Laura Pérez'][n % 5],
  status,
  payment_status: status === 'delivered' ? 'paid' : status === 'pending' ? 'pending' : 'paid',
  payment_method: paymentMethod,
  qr_token: `qr-${n}`,
  total: [3250, 2900, 5600, 1350, 7500][n % 5],
  items: [
    {
      product_id: 'prod-4',
      name: 'Hamburguesa Clásica',
      price: 2800,
      quantity: 1,
      subtotal: 2800,
      category_name: 'Comidas',
    },
    {
      product_id: 'prod-2',
      name: 'Gaseosa 500ml',
      price: 450,
      quantity: 1,
      subtotal: 450,
      category_name: 'Bebidas',
    },
  ],
  checkout_url: null,
  created_at: `2026-07-15T${String(10 + n).padStart(2, '0')}:${String(n * 7 % 60).padStart(2, '0')}:00Z`,
  updated_at: `2026-07-15T${String(10 + n).padStart(2, '0')}:${String(n * 7 % 60).padStart(2, '0')}:00Z`,
})

export const mockOrders = [
  makeMockOrder(1, 'pending', 'mp'),
  makeMockOrder(2, 'pending', 'cash'),
  makeMockOrder(3, 'preparing', 'mp'),
  makeMockOrder(4, 'preparing', 'transfer'),
  makeMockOrder(5, 'ready', 'mp'),
  makeMockOrder(6, 'delivered', 'mp'),
  makeMockOrder(7, 'delivered', 'cash'),
  makeMockOrder(8, 'pending', 'mp'),
]

export const mockPayments = mockOrders.map((o, i) => ({
  id: `pay-${i + 1}`,
  order_id: o.id,
  amount: o.total,
  currency: 'ARS',
  status: o.payment_status === 'paid' ? 'approved' : 'pending',
  provider: o.payment_method === 'mp' ? 'MercadoPago' : null,
  channel: o.payment_method,
  paid_at: o.payment_status === 'paid' ? o.created_at : null,
  created_at: o.created_at,
}))

export const mockPickupPoints = [
  {
    id: 'pp-1',
    event_id: MOCK_EVENT_ID,
    name: 'Mostrador Principal',
    description: 'Entrada norte, cerca de la tribuna',
    is_active: true,
    products: [
      { product_id: 'prod-1', name: 'Cerveza Artesanal 500ml', type: 'single', is_active: true },
      { product_id: 'prod-4', name: 'Hamburguesa Clásica', type: 'single', is_active: true },
    ],
  },
  {
    id: 'pp-2',
    event_id: MOCK_EVENT_ID,
    name: 'Mostrador Sur',
    description: 'Tribuna sur, planta baja',
    is_active: true,
    products: [
      { product_id: 'prod-2', name: 'Gaseosa 500ml', type: 'single', is_active: true },
      { product_id: 'prod-5', name: 'Choripán', type: 'single', is_active: true },
    ],
  },
  {
    id: 'pp-3',
    event_id: MOCK_EVENT_ID,
    name: 'Bar VIP',
    description: 'Acceso exclusivo palco',
    is_active: false,
    products: [],
  },
]

export const mockDashboard = {
  total_revenue: 42350,
  order_count: 8,
  active_orders: 4,
  delivered_orders: 2,
  by_status: { pending: 3, preparing: 2, ready: 1, delivered: 2, cancelled: 0 },
  hourly: Array.from({ length: 12 }, (_, i) => ({
    hour: `${10 + i}:00`,
    revenue: [0, 2500, 4200, 6800, 5100, 3900, 7200, 4500, 3100, 2800, 1500, 0][i],
  })),
  payment_breakdown: [
    { key: 'mp' as const, count: 5, revenue: 29500 },
    { key: 'cash' as const, count: 2, revenue: 8450 },
    { key: 'transfer' as const, count: 1, revenue: 4400 },
  ],
  top_products: [
    { name: 'Hamburguesa Clásica', quantity: 12, revenue: 33600 },
    { name: 'Gaseosa 500ml', quantity: 18, revenue: 8100 },
    { name: 'Combo Hamburguesa + Bebida', quantity: 6, revenue: 17400 },
    { name: 'Cerveza Artesanal 500ml', quantity: 9, revenue: 7650 },
    { name: 'Papas Fritas', quantity: 4, revenue: 3600 },
  ],
}

/** Respuesta del storefront para el comprador (GET /catalog/storefront/:slug). */
export const mockStorefront = {
  event: {
    id: MOCK_EVENT_ID,
    name: 'Demo Fest 2026',
    description: 'El mejor festival del año con comidas y bebidas para todos.',
    coverImageUrl: null,
    startsAt: '2026-07-15T18:00:00Z',
    venue: 'Estadio Centenario',
  },
  products: [
    {
      id: 'prod-1',
      name: 'Cerveza Artesanal 500ml',
      description: 'IPA clásica, bien fría',
      price: 850,
      category: 'Bebidas',
      available: true,
    },
    {
      id: 'prod-2',
      name: 'Gaseosa 500ml',
      description: 'Coca-Cola, Sprite o Fanta',
      price: 450,
      category: 'Bebidas',
      available: true,
    },
    {
      id: 'prod-3',
      name: 'Agua Mineral 500ml',
      description: 'Con o sin gas',
      price: 300,
      category: 'Bebidas',
      available: true,
    },
    {
      id: 'prod-4',
      name: 'Hamburguesa Clásica',
      description: 'Pan brioche, carne 180g, lechuga, tomate',
      price: 2800,
      category: 'Comidas',
      available: true,
    },
    {
      id: 'prod-5',
      name: 'Choripán',
      description: 'Con chimichurri casero',
      price: 1500,
      category: 'Comidas',
      available: true,
    },
    {
      id: 'prod-6',
      name: 'Papas Fritas',
      description: 'Porción grande con sal y ketchup',
      price: 900,
      category: 'Snacks',
      available: true,
    },
  ],
  combos: [
    {
      id: 'combo-1',
      name: 'Combo Hamburguesa + Bebida',
      description: 'Hamburguesa Clásica + Gaseosa 500ml',
      price: 2900,
      listPrice: 3250,
      promoLabel: '11% OFF',
      imageUrl: null,
      available: true,
      products: [
        { id: 'prod-4', name: 'Hamburguesa Clásica', description: '', price: 2800, category: 'Comidas', available: true, quantity: 1 },
        { id: 'prod-2', name: 'Gaseosa 500ml', description: '', price: 450, category: 'Bebidas', available: true, quantity: 1 },
      ],
    },
    {
      id: 'combo-2',
      name: 'Combo Familiar',
      description: '2 Hamburguesas + 2 Gaseosas + Papas',
      price: 7500,
      listPrice: 8500,
      promoLabel: '12% OFF',
      imageUrl: null,
      available: true,
      products: [
        { id: 'prod-4', name: 'Hamburguesa Clásica', description: '', price: 2800, category: 'Comidas', available: true, quantity: 2 },
        { id: 'prod-2', name: 'Gaseosa 500ml', description: '', price: 450, category: 'Bebidas', available: true, quantity: 2 },
        { id: 'prod-6', name: 'Papas Fritas', description: '', price: 900, category: 'Snacks', available: true, quantity: 1 },
      ],
    },
  ],
  theme: null,
}
