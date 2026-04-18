# Panel Organizador — Dashboard — Diseño

**Fecha:** 2026-04-17
**Contexto:** Segunda feature del panel del organizador. Mock data con simulación de nuevos pedidos cada 5 segundos. Sin backend.

---

## Resumen

Dashboard en tiempo real para el organizador con métricas de pedidos y ventas. Un hook maneja el estado y el timer de simulación; el componente de vista solo renderiza.

---

## Arquitectura

Server Component (página) → `<DashboardView />` Client Component que usa `useDashboard`.

- `app/(organizer)/dashboard/page.tsx`: renderiza `<DashboardView />`
- `useDashboard`: maneja `orders: Order[]` con `setInterval` de 5s que agrega pedidos aleatorios
- `DashboardView`: consume el hook y renderiza las métricas

---

## Nuevos archivos

| Archivo | Responsabilidad |
|---|---|
| `lib/hooks/useDashboard.ts` | Estado de pedidos + timer que agrega pedido aleatorio cada 5s |
| `components/organizer/DashboardView.tsx` | Tarjetas de estado, ventas y top productos |

**Archivos modificados:**

| Archivo | Cambio |
|---|---|
| `app/(organizer)/dashboard/page.tsx` | Conectar con DashboardView |

---

## Hook useDashboard

```typescript
function useDashboard(): { orders: Order[] }
```

- Inicia con `mockOrders` (6 pedidos del mock existente)
- `setInterval` cada 5000ms agrega un nuevo `Order` generado aleatoriamente:
  - `id`: `crypto.randomUUID()`
  - `eventId`: `'demo-event'`
  - `status`: `'pending'`
  - `items`: 1 item aleatorio del catálogo mock (productos o combos)
  - `total`: precio del item
  - `qrToken`: string aleatorio
  - `createdAt` / `updatedAt`: `new Date().toISOString()`
- Cleanup cancela el interval en el return del `useEffect`

---

## DashboardView

- Client Component (`'use client'`)
- Sin props
- Usa `useDashboard()`
- Renderiza 3 secciones:

### Tarjetas de estado (4 tarjetas)

| Tarjeta | Valor |
|---|---|
| Pendiente | `orders.filter(o => o.status === 'pending').length` |
| En preparación | `orders.filter(o => o.status === 'preparing').length` |
| Listo | `orders.filter(o => o.status === 'ready').length` |
| Entregado | `orders.filter(o => o.status === 'delivered').length` |

### Tarjetas de ventas (2 tarjetas)

| Tarjeta | Valor |
|---|---|
| Total recaudado | `formatPrice(orders.reduce((sum, o) => sum + o.total, 0))` |
| Total pedidos | `orders.length` |

### Top 3 productos

Agrupados por `item.name`, sumando `item.quantity` en todos los pedidos. Ordenados de mayor a menor. Se muestran los primeros 3 con nombre y cantidad total.

---

## Página

```typescript
// app/(organizer)/dashboard/page.tsx
import type { Metadata } from 'next'
import { DashboardView } from '@/components/organizer/DashboardView'

export const metadata: Metadata = {
  title: 'Dashboard — Nubapay',
}

export default function OrganizerDashboardPage() {
  return (
    <main className="min-h-screen p-6">
      <DashboardView />
    </main>
  )
}
```

---

## Testing

| Test | Qué verifica |
|---|---|
| `useDashboard` — inicia con mockOrders | `orders.length === 6` en estado inicial |
| `useDashboard` — agrega pedido cada 5s | con fake timers, después de 5000ms `orders.length === 7` |
| `DashboardView` — muestra las 4 tarjetas de estado | textos "Pendiente", "En preparación", "Listo", "Entregado" visibles |
| `DashboardView` — muestra total recaudado | texto con precio formateado visible |

---

## Fuera de alcance

- Gráficos o charts (Chart.js, Recharts, etc.)
- Filtros por rango de tiempo
- Exportación de datos
- Notificaciones de nuevos pedidos
- Integración con backend real
