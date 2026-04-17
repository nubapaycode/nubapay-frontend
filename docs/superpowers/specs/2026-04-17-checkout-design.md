# Checkout — Diseño

**Fecha:** 2026-04-17
**Contexto:** Tercera feature del buyer flow. `useCart` ya existe. El checkout simula el pago: recoge el nombre del comprador, muestra el resumen y genera un orderId mockeado al confirmar.

---

## Resumen

Página de checkout que muestra el resumen del pedido, solicita el nombre del comprador, y al confirmar genera un `orderId`, limpia el carrito y navega a la página de seguimiento.

---

## Arquitectura

Mismo patrón: Server Component (página) → props → `CheckoutView` Client Component.

- `app/(buyer)/[eventId]/checkout/page.tsx`: Server Component que pasa `eventId` a `<CheckoutView>`
- `CheckoutView`: maneja estado local (`name`, `error`), usa `useCart()`, ejecuta la lógica de confirmación

---

## Cambios en useCart

Agregar `clearCart()` al hook `lib/hooks/useCart.ts`:
- Llama `setItems([])`
- Se persiste automáticamente en localStorage via el `useEffect` existente

Interfaz actualizada:
```typescript
interface UseCart {
  items: CartItem[]
  addItem: (item: Product | Combo) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  total: number
  count: number
}
```

---

## Nuevos/modificados archivos

| Archivo | Cambio |
|---|---|
| `lib/hooks/useCart.ts` | Agregar `clearCart()` |
| `components/buyer/CheckoutView.tsx` | Nuevo Client Component |
| `app/(buyer)/[eventId]/checkout/page.tsx` | Conectar con CheckoutView |

Tests:
| Archivo | Cambio |
|---|---|
| `__tests__/lib/hooks/useCart.test.ts` | Agregar test de clearCart |
| `__tests__/components/buyer/CheckoutView.test.tsx` | Nuevo — 5 tests |

---

## CheckoutView

- Client Component (`'use client'`)
- Props: `eventId: string`
- Estado: `name: string` (default `''`), `error: string` (default `''`)
- Usa `useCart()`: `{ items, total, clearCart }`

### Empty state (`items.length === 0`)
- Texto: "No tenés items en el carrito"
- Botón secondary "← Volver al catálogo" → `router.push(`/${eventId}`)`

### Con items
**Resumen del pedido:**
- Por cada item: `{item.name}` — `{formatPrice(item.price * item.quantity)}`
- Línea de total: "Total" + `formatPrice(total)` en bold

**Formulario:**
- Label: "Tu nombre"
- Input tipo text, value=`name`, onChange actualiza `name` y limpia `error`
- Si `error` no está vacío: texto rojo debajo del input con el mensaje

**Botón "Confirmar pedido":**
- Variante primary, full width, size lg
- `disabled` si `items.length === 0`
- Al hacer click:
  1. Si `name.trim() === ''` → `setError('Ingresá tu nombre para continuar')`, no avanza
  2. Si válido → `orderId = crypto.randomUUID()`, `clearCart()`, `router.push(`/${eventId}/order/${orderId}`)`

---

## Testing

| Test | Qué verifica |
|---|---|
| `useCart` — clearCart | vacía todos los items |
| `CheckoutView` — muestra items | nombres visibles en el resumen |
| `CheckoutView` — muestra total | formatPrice(total) visible |
| `CheckoutView` — error si nombre vacío | mensaje de error al intentar confirmar sin nombre |
| `CheckoutView` — confirma con nombre válido | llama clearCart y navega a order tracking |
| `CheckoutView` — botón deshabilitado sin items | disabled cuando carrito vacío |

---

## Fuera de alcance

- Integración con gateway de pago real
- Campos adicionales (teléfono, email)
- Validación de formato del nombre
- Persistencia del pedido en backend
