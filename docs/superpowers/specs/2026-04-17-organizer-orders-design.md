# Panel Organizador — Gestión de Pedidos — Diseño

**Fecha:** 2026-04-17
**Contexto:** Primera feature del panel del organizador. Mock data, sin backend. Estado local en React.

---

## Resumen

Página de gestión de pedidos para el organizador, con vista Kanban de 4 columnas (Pendiente, En preparación, Listo, Entregado) y acciones para avanzar el estado de cada pedido.

---

## Arquitectura

Server Component (página) → `<OrdersView />` Client Component que maneja estado local.

- `app/(organizer)/orders/page.tsx`: renderiza `<OrdersView />`
- `OrdersView`: `useState<Order[]>` con mock data, expone handlers de transición
- `OrderKanban`: recibe pedidos y callbacks, renderiza las 4 columnas
- `OrderCard`: card individual con info del pedido y botones según estado

---

## Nuevos archivos

| Archivo | Responsabilidad |
|---|---|
| `lib/mock/orders.ts` | 6 pedidos mock distribuidos entre los 4 estados |
| `components/organizer/OrderCard.tsx` | Card de pedido: id, items, total, botones de acción |
| `components/organizer/OrderKanban.tsx` | Grilla Kanban de 4 columnas |
| `components/organizer/OrdersView.tsx` | Estado local + handlers de transición |

**Archivos modificados:**

| Archivo | Cambio |
|---|---|
| `app/(organizer)/orders/page.tsx` | Conectar con OrdersView |

---

## Mock data

`lib/mock/orders.ts` exporta `mockOrders: Order[]` con 6 pedidos:

| id | status | items |
|---|---|---|
| order-001 | pending | Hamburguesa Clásica ×1, Gaseosa 500ml ×1 |
| order-002 | pending | Empanadas x3 ×2 |
| order-003 | preparing | Pizza de Muzzarella ×1, Agua Mineral ×2 |
| order-004 | preparing | Combo Clásico ×1 |
| order-005 | ready | Hamburguesa Clásica ×2, Gaseosa 500ml ×2 |
| order-006 | delivered | Combo Familiar ×1 |

Cada `Order` sigue el tipo definido en `@/types`: `id, eventId, items: CartItem[], total, status, qrToken, createdAt, updatedAt`.

---

## OrderCard

- Client Component (`'use client'`)
- Props: `order: Order`, `onMarkReady?: () => void`, `onMarkDelivered?: () => void`
- Muestra:
  - `#{order.id.slice(0, 8)}` como referencia
  - Lista de items: `{item.name} ×{item.quantity}`
  - Total: `formatPrice(order.total)`
- Botones según `order.status`:
  - `pending` o `preparing` → Button primary "Marcar listo" → llama `onMarkReady`
  - `ready` → Button primary con `className="bg-green-600 hover:bg-green-700"` "Confirmar entrega" → llama `onMarkDelivered`
  - `delivered` → Badge success "Entregado ✓", sin botones

---

## OrderKanban

- Server/Client Component (sin estado propio)
- Props: `orders: Order[]`, `onMarkReady: (id: string) => void`, `onMarkDelivered: (id: string) => void`
- 4 columnas con header de color:

| Columna | Filter | Header color |
|---|---|---|
| Pendiente | pending | `bg-gray-100` |
| En preparación | preparing | `bg-yellow-50` |
| Listo | ready | `bg-green-50` |
| Entregado | delivered | `bg-gray-50` |

- Cada columna muestra: título + conteo (`N pedidos`) + lista de `OrderCard`

---

## OrdersView

- Client Component (`'use client'`)
- Sin props
- Estado: `const [orders, setOrders] = useState<Order[]>(mockOrders)`
- Handlers:
  - `handleMarkReady(id)` → `setOrders(prev => prev.map(o => o.id === id ? {...o, status: 'ready'} : o))`
  - `handleMarkDelivered(id)` → `setOrders(prev => prev.map(o => o.id === id ? {...o, status: 'delivered'} : o))`
- Renderiza `<OrderKanban orders={orders} onMarkReady={handleMarkReady} onMarkDelivered={handleMarkDelivered} />`

---

## Testing

| Test | Qué verifica |
|---|---|
| `OrderCard` — pending: muestra "Marcar listo" | botón visible |
| `OrderCard` — ready: muestra "Confirmar entrega" | botón visible |
| `OrderCard` — delivered: muestra badge "Entregado" | sin botones |
| `OrderCard` — click "Marcar listo" llama onMarkReady | callback correcto |
| `OrderKanban` — renderiza 4 columnas | headers Pendiente, En preparación, Listo, Entregado |
| `OrdersView` — marcar listo mueve pedido a columna ready | estado local actualiza |

---

## Fuera de alcance

- Persistencia en backend
- Filtros adicionales por producto o punto de entrega
- Escaneo de QR para confirmar entrega
- Tiempo real con WebSockets
- Dashboard de métricas
