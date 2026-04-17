# Carrito de Compras — Diseño

**Fecha:** 2026-04-17
**Contexto:** Segunda feature del buyer flow. El `useCart` hook ya existe con `items`, `updateQuantity`, `removeItem`, `total`, `count`. La página `cart/page.tsx` está scaffoldeada.

---

## Resumen

Página de carrito que muestra los items seleccionados, permite ajustar cantidades, muestra el total y tiene acciones para volver al catálogo o continuar al checkout.

---

## Arquitectura

Mismo patrón que el catálogo: Server Component (página) → props → Client Component (CartView).

- `app/(buyer)/[eventId]/cart/page.tsx`: Server Component que recibe `eventId` y renderiza `<CartView eventId={eventId} />`
- `CartView`: Client Component que usa `useCart()` y maneja la lógica de presentación
- `CartItemRow`: Client Component para cada fila del carrito

---

## Nuevos archivos

| Archivo | Responsabilidad |
|---|---|
| `components/buyer/CartItemRow.tsx` | Fila de item: nombre, precio unitario, counter −/+, subtotal |
| `components/buyer/CartView.tsx` | Orquestador: empty state o lista de items + total + acciones |

**Archivos modificados:**

| Archivo | Cambio |
|---|---|
| `app/(buyer)/[eventId]/cart/page.tsx` | Conectar con CartView pasando eventId |

---

## Componentes

### `CartItemRow`
- Client Component (`'use client'`)
- Props: `item: CartItem`, `onUpdateQuantity: (productId: string, quantity: number) => void`
- Muestra:
  - Nombre del item (`item.name`)
  - Precio unitario formateado (`formatPrice(item.price)`)
  - Counter inline `− N +` (mismo patrón que ProductCard)
  - Subtotal formateado (`formatPrice(item.price * item.quantity)`)
- Al llevar quantity a 0 via `−` → llama `onUpdateQuantity(item.productId, 0)` → `useCart` hace `removeItem`

### `CartView`
- Client Component (`'use client'`)
- Props: `eventId: string`
- Usa `useCart()`: `{ items, updateQuantity, total, count }`

**Estado vacío** (`items.length === 0`):
- Emoji 🛒 grande
- Texto "Tu carrito está vacío"
- Botón secundario "← Volver al catálogo" → navega a `/${eventId}`

**Con items**:
- Lista de `<CartItemRow>` por cada item
- Línea de separación
- Total: "Total" label + `formatPrice(total)` en bold
- Botón primario "Ir al checkout →" → navega a `/${eventId}/checkout`
- Botón ghost/link "← Seguir comprando" → navega a `/${eventId}`

---

## Página actualizada

```typescript
// app/(buyer)/[eventId]/cart/page.tsx
export default async function CartPage({ params }) {
  const { eventId } = await params
  return (
    <main className="min-h-screen p-4 pb-24">
      <CartView eventId={eventId} />
    </main>
  )
}
```

---

## Testing

| Test | Qué verifica |
|---|---|
| `CartItemRow` — muestra nombre y precio | texto visible |
| `CartItemRow` — muestra subtotal | price × quantity formateado |
| `CartItemRow` — click + llama onUpdateQuantity(id, qty+1) | callback correcto |
| `CartItemRow` — click − llama onUpdateQuantity(id, qty-1) | callback correcto |
| `CartView` vacío — muestra empty state | texto "Tu carrito está vacío" |
| `CartView` vacío — botón navega al catálogo | router.push llamado con /${eventId} |
| `CartView` con items — muestra CartItemRow por cada item | rendering correcto |
| `CartView` con items — muestra total | formatPrice(total) visible |
| `CartView` con items — botón checkout navega a checkout | router.push llamado con /${eventId}/checkout |

---

## Fuera de alcance

- Integración con API / persistencia en servidor
- Confirmación antes de vaciar el carrito
- Notas o instrucciones especiales por item
- Checkout real (la página de checkout sigue siendo scaffold)
