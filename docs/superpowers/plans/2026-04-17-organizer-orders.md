# Panel Organizador — Gestión de Pedidos — Plan de Implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar el panel Kanban de gestión de pedidos para el organizador, con mock data y acciones para marcar pedidos como "listo" y "entregado".

**Architecture:** `OrdersView` Client Component maneja `useState<Order[]>` con mock data y expone handlers. `OrderKanban` renderiza 4 columnas. `OrderCard` muestra cada pedido con sus botones de acción según el estado.

**Tech Stack:** Next.js 15 App Router, TypeScript, Tailwind v4, Jest + React Testing Library

---

## Estructura de archivos

| Archivo | Responsabilidad |
|---|---|
| `lib/mock/orders.ts` | 6 pedidos mock distribuidos entre los 4 estados |
| `components/organizer/OrderCard.tsx` | Card: id, items, total, botones por estado |
| `components/organizer/OrderKanban.tsx` | Grilla Kanban de 4 columnas |
| `components/organizer/OrdersView.tsx` | Estado local + handlers de transición |
| `app/(organizer)/orders/page.tsx` | Actualizar: renderizar OrdersView |
| `__tests__/components/organizer/OrderCard.test.tsx` | 6 tests |
| `__tests__/components/organizer/OrderKanban.test.tsx` | 2 tests |
| `__tests__/components/organizer/OrdersView.test.tsx` | 2 tests |

---

## Tarea 1: Mock data + directorios

**Files:**
- Create: `lib/mock/orders.ts`

- [ ] **Step 1: Crear directorio de tests**

```bash
mkdir -p __tests__/components/organizer components/organizer
```

- [ ] **Step 2: Crear lib/mock/orders.ts**

```typescript
// lib/mock/orders.ts
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
```

- [ ] **Step 3: Verificar TypeScript**

```bash
npx tsc --noEmit
```

Expected: sin errores.

- [ ] **Step 4: Commit**

```bash
git add lib/mock/orders.ts __tests__/components/organizer/ components/organizer/
git commit -m "chore: add mock orders data and organizer directories"
```

---

## Tarea 2: OrderCard (TDD)

**Files:**
- Create: `__tests__/components/organizer/OrderCard.test.tsx`
- Create: `components/organizer/OrderCard.tsx`

- [ ] **Step 1: Escribir tests**

```typescript
// __tests__/components/organizer/OrderCard.test.tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { OrderCard } from '@/components/organizer/OrderCard'
import type { Order } from '@/types'

const baseOrder: Order = {
  id: 'abc12345-test',
  eventId: 'demo-event',
  items: [
    { productId: 'p1', name: 'Hamburguesa Clásica', price: 3500, quantity: 1 },
    { productId: 'p4', name: 'Gaseosa 500ml', price: 1200, quantity: 2 },
  ],
  total: 5900,
  status: 'pending',
  qrToken: 'token-test',
  createdAt: '2026-04-17T10:00:00Z',
  updatedAt: '2026-04-17T10:00:00Z',
}

describe('OrderCard', () => {
  it('muestra el id truncado con #', () => {
    render(<OrderCard order={baseOrder} />)
    expect(screen.getByText('#abc12345')).toBeInTheDocument()
  })

  it('muestra botón "Marcar listo" cuando status=pending', () => {
    render(<OrderCard order={baseOrder} onMarkReady={jest.fn()} />)
    expect(screen.getByRole('button', { name: 'Marcar listo' })).toBeInTheDocument()
  })

  it('muestra botón "Marcar listo" cuando status=preparing', () => {
    render(<OrderCard order={{ ...baseOrder, status: 'preparing' }} onMarkReady={jest.fn()} />)
    expect(screen.getByRole('button', { name: 'Marcar listo' })).toBeInTheDocument()
  })

  it('muestra botón "Confirmar entrega" cuando status=ready', () => {
    render(<OrderCard order={{ ...baseOrder, status: 'ready' }} onMarkDelivered={jest.fn()} />)
    expect(screen.getByRole('button', { name: 'Confirmar entrega' })).toBeInTheDocument()
  })

  it('muestra badge "Entregado" y sin botones cuando status=delivered', () => {
    render(<OrderCard order={{ ...baseOrder, status: 'delivered' }} />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    expect(screen.getByText(/Entregado/)).toBeInTheDocument()
  })

  it('llama onMarkReady al hacer click en "Marcar listo"', async () => {
    const handleReady = jest.fn()
    render(<OrderCard order={baseOrder} onMarkReady={handleReady} />)
    await userEvent.click(screen.getByRole('button', { name: 'Marcar listo' }))
    expect(handleReady).toHaveBeenCalledTimes(1)
  })
})
```

- [ ] **Step 2: Correr tests — deben fallar**

```bash
npm test -- __tests__/components/organizer/OrderCard.test.tsx
```

Expected: `FAIL`

- [ ] **Step 3: Implementar OrderCard**

```typescript
// components/organizer/OrderCard.tsx
'use client'

import type { Order } from '@/types'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { formatPrice } from '@/lib/utils'

interface OrderCardProps {
  order: Order
  onMarkReady?: () => void
  onMarkDelivered?: () => void
}

export function OrderCard({ order, onMarkReady, onMarkDelivered }: OrderCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 flex flex-col gap-2">
      <p className="text-xs font-mono text-gray-500">#{order.id.slice(0, 8)}</p>

      <div className="flex flex-col gap-0.5">
        {order.items.map(item => (
          <p key={item.productId} className="text-xs text-gray-700">
            {item.name} ×{item.quantity}
          </p>
        ))}
      </div>

      <p className="text-sm font-bold">{formatPrice(order.total)}</p>

      <div className="mt-1">
        {(order.status === 'pending' || order.status === 'preparing') && onMarkReady && (
          <Button size="sm" className="w-full" onClick={onMarkReady}>
            Marcar listo
          </Button>
        )}
        {order.status === 'ready' && onMarkDelivered && (
          <Button
            size="sm"
            className="w-full bg-green-600 hover:bg-green-700"
            onClick={onMarkDelivered}
          >
            Confirmar entrega
          </Button>
        )}
        {order.status === 'delivered' && (
          <Badge variant="success">Entregado ✓</Badge>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Correr tests — deben pasar**

```bash
npm test -- __tests__/components/organizer/OrderCard.test.tsx
```

Expected: `PASS` (6 tests verdes)

- [ ] **Step 5: Commit**

```bash
git add components/organizer/OrderCard.tsx __tests__/components/organizer/OrderCard.test.tsx
git commit -m "feat: add OrderCard component for organizer panel"
```

---

## Tarea 3: OrderKanban (TDD)

**Files:**
- Create: `__tests__/components/organizer/OrderKanban.test.tsx`
- Create: `components/organizer/OrderKanban.tsx`

- [ ] **Step 1: Escribir tests**

```typescript
// __tests__/components/organizer/OrderKanban.test.tsx
import { render, screen } from '@testing-library/react'
import { OrderKanban } from '@/components/organizer/OrderKanban'
import type { Order } from '@/types'

const makeOrder = (id: string, status: Order['status']): Order => ({
  id,
  eventId: 'demo',
  items: [],
  total: 0,
  status,
  qrToken: 'token',
  createdAt: '',
  updatedAt: '',
})

describe('OrderKanban', () => {
  it('renderiza las 4 columnas con sus headers', () => {
    render(<OrderKanban orders={[]} onMarkReady={jest.fn()} onMarkDelivered={jest.fn()} />)
    expect(screen.getByText('Pendiente')).toBeInTheDocument()
    expect(screen.getByText('En preparación')).toBeInTheDocument()
    expect(screen.getByText('Listo')).toBeInTheDocument()
    expect(screen.getByText('Entregado')).toBeInTheDocument()
  })

  it('muestra el conteo correcto de pedidos por columna', () => {
    const orders = [
      makeOrder('o1', 'pending'),
      makeOrder('o2', 'pending'),
      makeOrder('o3', 'ready'),
    ]
    render(<OrderKanban orders={orders} onMarkReady={jest.fn()} onMarkDelivered={jest.fn()} />)
    expect(screen.getByText('2 pedidos')).toBeInTheDocument()
    expect(screen.getByText('1 pedido')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Correr tests — deben fallar**

```bash
npm test -- __tests__/components/organizer/OrderKanban.test.tsx
```

Expected: `FAIL`

- [ ] **Step 3: Implementar OrderKanban**

```typescript
// components/organizer/OrderKanban.tsx
import type { Order, OrderStatus } from '@/types'
import { cn } from '@/lib/utils'
import { OrderCard } from './OrderCard'

interface Column {
  key: OrderStatus
  label: string
  headerClass: string
}

const COLUMNS: Column[] = [
  { key: 'pending', label: 'Pendiente', headerClass: 'bg-gray-100' },
  { key: 'preparing', label: 'En preparación', headerClass: 'bg-yellow-50' },
  { key: 'ready', label: 'Listo', headerClass: 'bg-green-50' },
  { key: 'delivered', label: 'Entregado', headerClass: 'bg-gray-50' },
]

interface OrderKanbanProps {
  orders: Order[]
  onMarkReady: (id: string) => void
  onMarkDelivered: (id: string) => void
}

export function OrderKanban({ orders, onMarkReady, onMarkDelivered }: OrderKanbanProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      {COLUMNS.map(col => {
        const colOrders = orders.filter(o => o.status === col.key)
        return (
          <div key={col.key} className="flex flex-col gap-3">
            <div className={cn('rounded-lg px-3 py-2', col.headerClass)}>
              <h2 className="font-semibold text-sm">{col.label}</h2>
              <p className="text-xs text-gray-500">
                {colOrders.length} {colOrders.length === 1 ? 'pedido' : 'pedidos'}
              </p>
            </div>
            <div className="flex flex-col gap-2">
              {colOrders.map(order => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onMarkReady={
                    col.key === 'pending' || col.key === 'preparing'
                      ? () => onMarkReady(order.id)
                      : undefined
                  }
                  onMarkDelivered={
                    col.key === 'ready' ? () => onMarkDelivered(order.id) : undefined
                  }
                />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 4: Correr tests — deben pasar**

```bash
npm test -- __tests__/components/organizer/OrderKanban.test.tsx
```

Expected: `PASS` (2 tests verdes)

- [ ] **Step 5: Commit**

```bash
git add components/organizer/OrderKanban.tsx __tests__/components/organizer/OrderKanban.test.tsx
git commit -m "feat: add OrderKanban component with 4-column layout"
```

---

## Tarea 4: OrdersView (TDD)

**Files:**
- Create: `__tests__/components/organizer/OrdersView.test.tsx`
- Create: `components/organizer/OrdersView.tsx`

- [ ] **Step 1: Escribir tests**

```typescript
// __tests__/components/organizer/OrdersView.test.tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { OrdersView } from '@/components/organizer/OrdersView'

describe('OrdersView', () => {
  it('renderiza el kanban con los 4 headers', () => {
    render(<OrdersView />)
    expect(screen.getByText('Pendiente')).toBeInTheDocument()
    expect(screen.getByText('En preparación')).toBeInTheDocument()
    expect(screen.getByText('Listo')).toBeInTheDocument()
    expect(screen.getByText('Entregado')).toBeInTheDocument()
  })

  it('al marcar listo un pedido, aumenta el conteo de "Confirmar entrega"', async () => {
    render(<OrdersView />)
    const initialConfirmCount = screen.getAllByRole('button', { name: 'Confirmar entrega' }).length
    const markReadyButtons = screen.getAllByRole('button', { name: 'Marcar listo' })
    await userEvent.click(markReadyButtons[0])
    const newConfirmCount = screen.getAllByRole('button', { name: 'Confirmar entrega' }).length
    expect(newConfirmCount).toBe(initialConfirmCount + 1)
  })
})
```

- [ ] **Step 2: Correr tests — deben fallar**

```bash
npm test -- __tests__/components/organizer/OrdersView.test.tsx
```

Expected: `FAIL`

- [ ] **Step 3: Implementar OrdersView**

```typescript
// components/organizer/OrdersView.tsx
'use client'

import { useState } from 'react'
import { mockOrders } from '@/lib/mock/orders'
import { OrderKanban } from './OrderKanban'
import type { Order } from '@/types'

export function OrdersView() {
  const [orders, setOrders] = useState<Order[]>(mockOrders)

  const handleMarkReady = (id: string) => {
    setOrders(prev =>
      prev.map(o => (o.id === id ? { ...o, status: 'ready' as const } : o))
    )
  }

  const handleMarkDelivered = (id: string) => {
    setOrders(prev =>
      prev.map(o => (o.id === id ? { ...o, status: 'delivered' as const } : o))
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Pedidos</h1>
      <OrderKanban
        orders={orders}
        onMarkReady={handleMarkReady}
        onMarkDelivered={handleMarkDelivered}
      />
    </div>
  )
}
```

- [ ] **Step 4: Correr tests — deben pasar**

```bash
npm test -- __tests__/components/organizer/OrdersView.test.tsx
```

Expected: `PASS` (2 tests verdes)

- [ ] **Step 5: Commit**

```bash
git add components/organizer/OrdersView.tsx __tests__/components/organizer/OrdersView.test.tsx
git commit -m "feat: add OrdersView with Kanban state management"
```

---

## Tarea 5: Actualizar página + build

**Files:**
- Modify: `app/(organizer)/orders/page.tsx`

- [ ] **Step 1: Actualizar orders/page.tsx**

Reemplazar el contenido completo con:

```typescript
// app/(organizer)/orders/page.tsx
import type { Metadata } from 'next'
import { OrdersView } from '@/components/organizer/OrdersView'

export const metadata: Metadata = {
  title: 'Pedidos — Nubapay',
}

export default function OrganizerOrdersPage() {
  return (
    <main className="min-h-screen p-6">
      <OrdersView />
    </main>
  )
}
```

- [ ] **Step 2: Correr todos los tests**

```bash
npm test
```

Expected: todos los tests pasan (aprox 91 total).

- [ ] **Step 3: Verificar build**

```bash
npm run build
```

Expected: build exitoso.

- [ ] **Step 4: Commit**

```bash
git add app/(organizer)/orders/page.tsx
git commit -m "feat: wire organizer orders page with Kanban view"
```
