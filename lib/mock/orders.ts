import type { Order } from '@/types'

export const mockOrders: Order[] = [
  {
    id: 'abc10001-xxxx', eventId: 'demo-event',
    items: [{ productId: 'p6', name: 'Cerveza Tirada 500ml', price: 2000, quantity: 2 }, { productId: 'p4', name: 'Gaseosa 500ml', price: 1200, quantity: 1 }],
    total: 5200, status: 'pending', qrToken: 'token-001', paymentMethod: 'mp',
    createdAt: '2026-04-17T10:00:00Z', updatedAt: '2026-04-17T10:00:00Z',
  },
  {
    id: 'abc10002-xxxx', eventId: 'demo-event',
    items: [{ productId: 'p7', name: 'Fernet con Coca', price: 2500, quantity: 2 }],
    total: 5000, status: 'pending', qrToken: 'token-002', paymentMethod: 'cash',
    createdAt: '2026-04-17T10:01:00Z', updatedAt: '2026-04-17T10:01:00Z',
  },
  {
    id: 'abc10003-xxxx', eventId: 'demo-event',
    items: [{ productId: 'p8', name: 'Vino en Copa', price: 2200, quantity: 1 }, { productId: 'p5', name: 'Agua Mineral 500ml', price: 800, quantity: 2 }],
    total: 3800, status: 'preparing', qrToken: 'token-003', paymentMethod: 'transfer',
    createdAt: '2026-04-17T09:55:00Z', updatedAt: '2026-04-17T09:58:00Z',
  },
  {
    id: 'abc10004-xxxx', eventId: 'demo-event',
    items: [{ productId: 'c1', name: 'Combo Clásico', price: 2800, quantity: 1 }],
    total: 2800, status: 'preparing', qrToken: 'token-004', paymentMethod: 'mp',
    createdAt: '2026-04-17T09:52:00Z', updatedAt: '2026-04-17T09:56:00Z',
  },
  {
    id: 'abc10005-xxxx', eventId: 'demo-event',
    items: [{ productId: 'p6', name: 'Cerveza Tirada 500ml', price: 2000, quantity: 3 }, { productId: 'p9', name: 'Energizante 473ml', price: 1800, quantity: 1 }],
    total: 7800, status: 'ready', qrToken: 'token-005', paymentMethod: 'mp',
    createdAt: '2026-04-17T09:45:00Z', updatedAt: '2026-04-17T09:50:00Z',
  },
  {
    id: 'abc10006-xxxx', eventId: 'demo-event',
    items: [{ productId: 'c2', name: 'Combo Familiar', price: 9000, quantity: 1 }],
    total: 9000, status: 'delivered', qrToken: 'token-006', paymentMethod: 'cash',
    createdAt: '2026-04-17T09:30:00Z', updatedAt: '2026-04-17T09:40:00Z',
  },
]
