import type { Order } from '@/types'

export const mockOrders: Order[] = [
  {
    id: 'abc10001-xxxx',
    eventId: 'demo-event',
    items: [
      { productId: 'p1', name: 'Hamburguesa Clásica', price: 3500, quantity: 1 },
      { productId: 'p4', name: 'Gaseosa 500ml', price: 1200, quantity: 1 },
    ],
    total: 4700,
    status: 'pending',
    qrToken: 'token-001',
    createdAt: '2026-04-17T10:00:00Z',
    updatedAt: '2026-04-17T10:00:00Z',
  },
  {
    id: 'abc10002-xxxx',
    eventId: 'demo-event',
    items: [
      { productId: 'p3', name: 'Empanadas x3', price: 2200, quantity: 2 },
    ],
    total: 4400,
    status: 'pending',
    qrToken: 'token-002',
    createdAt: '2026-04-17T10:01:00Z',
    updatedAt: '2026-04-17T10:01:00Z',
  },
  {
    id: 'abc10003-xxxx',
    eventId: 'demo-event',
    items: [
      { productId: 'p2', name: 'Pizza de Muzzarella', price: 2800, quantity: 1 },
      { productId: 'p5', name: 'Agua Mineral 500ml', price: 800, quantity: 2 },
    ],
    total: 4400,
    status: 'preparing',
    qrToken: 'token-003',
    createdAt: '2026-04-17T09:55:00Z',
    updatedAt: '2026-04-17T09:58:00Z',
  },
  {
    id: 'abc10004-xxxx',
    eventId: 'demo-event',
    items: [
      { productId: 'c1', name: 'Combo Clásico', price: 4200, quantity: 1 },
    ],
    total: 4200,
    status: 'preparing',
    qrToken: 'token-004',
    createdAt: '2026-04-17T09:52:00Z',
    updatedAt: '2026-04-17T09:56:00Z',
  },
  {
    id: 'abc10005-xxxx',
    eventId: 'demo-event',
    items: [
      { productId: 'p1', name: 'Hamburguesa Clásica', price: 3500, quantity: 2 },
      { productId: 'p4', name: 'Gaseosa 500ml', price: 1200, quantity: 2 },
    ],
    total: 9400,
    status: 'ready',
    qrToken: 'token-005',
    createdAt: '2026-04-17T09:45:00Z',
    updatedAt: '2026-04-17T09:50:00Z',
  },
  {
    id: 'abc10006-xxxx',
    eventId: 'demo-event',
    items: [
      { productId: 'c2', name: 'Combo Familiar', price: 4400, quantity: 1 },
    ],
    total: 4400,
    status: 'delivered',
    qrToken: 'token-006',
    createdAt: '2026-04-17T09:30:00Z',
    updatedAt: '2026-04-17T09:40:00Z',
  },
]
