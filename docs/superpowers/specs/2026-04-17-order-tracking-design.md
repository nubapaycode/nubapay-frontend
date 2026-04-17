# Seguimiento de Pedido + QR de Retiro — Diseño

**Fecha:** 2026-04-17
**Contexto:** Cuarta feature del buyer flow. El `orderId` se genera en el checkout y se usa para navegar a estas páginas. No hay backend real — se simula la progresión de estados con timers.

---

## Resumen

Dos páginas del buyer flow:
1. **Order tracking** (`/[eventId]/order/[orderId]`): muestra el estado del pedido con un stepper visual que avanza automáticamente. Al llegar a "ready", aparece un botón para ver el QR.
2. **QR de retiro** (`/[eventId]/qr/[orderId]`): muestra un QR mockeado y el mensaje de retiro.

---

## Arquitectura

Patrón consistente con las demás páginas: Server Component (página) → props → Client Component.

- `useOrderStatus(orderId)`: hook que simula la progresión de estados con `setTimeout`
- `OrderTracker`: Client Component que usa el hook y renderiza el stepper
- `QRDisplay`: Client Component estático con el QR mockeado
- Ambas páginas pasan `orderId` y `eventId` como props a sus respectivos Client Components

---

## Nuevos archivos

| Archivo | Responsabilidad |
|---|---|
| `lib/hooks/useOrderStatus.ts` | Hook que simula progresión: pending → preparing → ready |
| `components/buyer/OrderTracker.tsx` | Stepper de 4 pasos + botón QR cuando ready |
| `components/buyer/QRDisplay.tsx` | QR mockeado + mensaje de retiro |

**Archivos modificados:**

| Archivo | Cambio |
|---|---|
| `app/(buyer)/[eventId]/order/[orderId]/page.tsx` | Conectar con OrderTracker |
| `app/(buyer)/[eventId]/qr/[orderId]/page.tsx` | Conectar con QRDisplay |

---

## Hook useOrderStatus

```typescript
// lib/hooks/useOrderStatus.ts
function useOrderStatus(orderId: string): { status: OrderStatus }
```

- Inicia en `'pending'`
- A los 3000ms → `'preparing'`
- A los 6000ms → `'ready'`
- No avanza a `'delivered'` automáticamente
- Limpia los timers en el cleanup del `useEffect`
- El `orderId` está en la firma pero no se usa en la simulación (queda listo para API real)

---

## OrderTracker

- Client Component (`'use client'`)
- Props: `orderId: string`, `eventId: string`
- Usa `useOrderStatus(orderId)`

**Stepper de 4 pasos:**

| Paso | Status que lo activa | Label |
|---|---|---|
| 1 | siempre activo | Recibido |
| 2 | preparing, ready, delivered | En preparación |
| 3 | ready, delivered | Listo |
| 4 | delivered | Entregado |

Cada paso muestra:
- `✓` (completado) si el estado ya pasó ese paso
- `●` (activo) si es el estado actual
- `○` (pendiente) si todavía no llegó

**Referencia del pedido:** texto `#{orderId.slice(0, 8)}` visible arriba del stepper

**Botón QR:** solo visible cuando `status === 'ready'`
- Texto: "Ver QR de retiro →"
- Variante primary, full width
- Navega a `/${eventId}/qr/${orderId}`

---

## QRDisplay

- Client Component (`'use client'`)
- Props: `orderId: string`
- Badge verde "Listo para retirar"
- Mensaje: "Mostrá este código al retirar tu pedido"
- QR mockeado: grilla CSS de 10×10 cuadrados con patrón visual fijo (checkerboard + bordes)
- Referencia: `#{orderId.slice(0, 8)}` debajo del QR

---

## Testing

| Test | Qué verifica |
|---|---|
| `useOrderStatus` — inicia en pending | status inicial = 'pending' |
| `useOrderStatus` — avanza a preparing | después de 3000ms, status = 'preparing' |
| `useOrderStatus` — avanza a ready | después de 6000ms, status = 'ready' |
| `OrderTracker` — muestra los 4 labels | Recibido, En preparación, Listo, Entregado visibles |
| `OrderTracker` — no muestra botón QR cuando pending | botón ausente en estado inicial |
| `OrderTracker` — muestra botón QR cuando ready | botón visible con status='ready' |
| `QRDisplay` — muestra mensaje de retiro | texto visible |
| `QRDisplay` — muestra orderId truncado | `#` + primeros 8 chars visible |

---

## Fuera de alcance

- Integración con API real de pedidos
- Estado 'delivered' automático
- Notificaciones push
- Historial de pedidos
