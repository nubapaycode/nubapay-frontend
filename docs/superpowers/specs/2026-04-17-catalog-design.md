# Catálogo de Productos — Diseño

**Fecha:** 2026-04-17
**Contexto:** Primera feature real del buyer flow. Construida sobre el proyecto inicializado (Next.js 15, Tailwind v4, TypeScript, componentes UI base).

---

## Resumen

Página de catálogo (`/(buyer)/[eventId]`) que muestra productos y combos de un evento con mock data, filtro por categoría, botón "Agregar" con counter inline, y botón flotante del carrito.

---

## Arquitectura

**Patrón:** Server Component (página) → datos mock → props → Client Components interactivos.

- La página `app/(buyer)/[eventId]/page.tsx` es un Server Component que importa el mock y pasa los datos via props.
- Los componentes interactivos (ProductCard, CategoryFilter, FloatingCart) son Client Components con `'use client'`.
- El estado del carrito vive en `useCart` hook que persiste en `localStorage`.

---

## Nuevos archivos

| Archivo | Responsabilidad |
|---|---|
| `lib/mock/event.ts` | Objeto `Event` hardcodeado con 4-5 productos (2 categorías) y 2 combos |
| `lib/hooks/useCart.ts` | Estado del carrito en localStorage: items, addItem, removeItem, updateQuantity, total, count |
| `components/buyer/CatalogView.tsx` | Client Component wrapper que maneja `activeCategory` y conecta `useCart` con las cards |
| `components/buyer/ProductCard.tsx` | Card de producto: imagen, nombre, descripción, precio, botón Agregar / counter inline |
| `components/buyer/ComboCard.tsx` | Card de combo: igual que ProductCard + lista de productos incluidos |
| `components/buyer/CategoryFilter.tsx` | Chips horizontales scrolleables: "Todos" + una por categoría |
| `components/buyer/FloatingCart.tsx` | Botón fijo bottom-right, visible solo si count > 0, navega a cart |
| `components/buyer/CatalogSection.tsx` | Wrapper con título + grid de 2 columnas mobile |

**Archivos modificados:**
| Archivo | Cambio |
|---|---|
| `app/(buyer)/[eventId]/page.tsx` | Conectar con mock data y renderizar los componentes del catálogo |

---

## Componentes

### `ProductCard`
- Client Component (`'use client'`)
- Props: `product: Product`, `onAdd: (product: Product) => void`, `quantity: number`
- Muestra: imagen con fallback de placeholder, nombre, descripción truncada a 2 líneas, precio formateado con `formatPrice`, badge de categoría con `Badge`
- Si `quantity === 0`: botón "Agregar" (primary)
- Si `quantity > 0`: counter inline `− N +` (con botones secondary/ghost)

### `ComboCard`
- Client Component (`'use client'`)
- Props: `combo: Combo`, `onAdd: (combo: Combo) => void`, `quantity: number`
- Igual que ProductCard + lista compacta de nombres de productos incluidos (ej: "Incluye: Hamburguesa, Papas, Gaseosa")

### `CategoryFilter`
- Client Component (`'use client'`)
- Props: `categories: string[]`, `active: string`, `onChange: (category: string) => void`
- Primer chip: "Todos" (value = `'all'`)
- Scroll horizontal sin scrollbar visible (`overflow-x-auto scrollbar-hide`)
- Chip activa: fondo sólido (ej: `bg-gray-900 text-white`), inactiva: borde gris

### `FloatingCart`
- Client Component (`'use client'`)
- Props: `count: number`, `total: number`, `eventId: string`
- Solo renderiza si `count > 0`
- Posición: `fixed bottom-6 right-6 z-40`
- Contenido: `{count} {count === 1 ? 'item' : 'items'} · {formatPrice(total)}`
- Al hacer click: `router.push(`/${eventId}/cart`)`

### `CatalogSection`
- Server Component (sin interacción)
- Props: `title: string`, `children: React.ReactNode`
- Grid de 2 columnas en mobile (`grid grid-cols-2 gap-3`)

---

## Hook `useCart`

```typescript
interface UseCart {
  items: CartItem[]
  addItem: (item: Product | Combo) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  total: number
  count: number
}
```

- Inicializa desde `localStorage` en `useEffect` (evita hidratación mismatch)
- Persiste en `localStorage` en cada cambio via `useEffect([items])`
- `addItem`: si ya existe el id, incrementa cantidad en 1; si no, agrega con quantity = 1
- `updateQuantity(id, 0)` equivale a `removeItem(id)`
- `total`: `items.reduce((sum, item) => sum + item.price * item.quantity, 0)`
- `count`: `items.reduce((sum, item) => sum + item.quantity, 0)`

---

## Datos mock

`lib/mock/event.ts` exporta un `Event` con:
- **Productos (5):** 3 de categoría "Comidas" (hamburguesa, pizza, empanadas) y 2 de "Bebidas" (gaseosa, agua)
- **Combos (2):** "Combo Clásico" (hamburguesa + gaseosa) y "Combo Familiar" (pizza + 2 gaseosas)
- Precios en ARS, imageUrl en null (para probar el fallback)

---

## Página del catálogo actualizada

```
app/(buyer)/[eventId]/page.tsx
```

- Importa mock del evento
- Importa mock y renderiza `<CatalogView event={mockEvent} />`
- `CatalogView` es el Client Component que maneja `activeCategory` con `useState`, usa `useCart`, y renderiza: `<CategoryFilter>` + `<CatalogSection>` con `<ProductCard>` / `<ComboCard>` + `<FloatingCart>`

---

## Testing

| Test | Qué verifica |
|---|---|
| `useCart` — addItem nuevo | agrega item con quantity=1 |
| `useCart` — addItem existente | incrementa quantity |
| `useCart` — removeItem | elimina el item |
| `useCart` — updateQuantity(id, 0) | elimina el item |
| `useCart` — total y count | calcula correctamente |
| `ProductCard` — sin cantidad | muestra botón "Agregar" |
| `ProductCard` — con cantidad > 0 | muestra counter inline con quantity |
| `ProductCard` — click Agregar | llama onAdd |
| `CategoryFilter` — click chip | llama onChange con la categoría |
| `CategoryFilter` — chip activa | tiene clases de estado activo |
| `FloatingCart` — count = 0 | no renderiza |
| `FloatingCart` — count > 0 | renderiza con count y total |

---

## Fuera de alcance (esta iteración)

- Integración con API real
- Modal de detalle del producto
- Búsqueda por texto
- Animaciones de carrito
- Imágenes reales (se usa placeholder)
