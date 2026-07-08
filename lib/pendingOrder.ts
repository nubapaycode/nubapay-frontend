/**
 * Orden pre-creada desde el carrito (checkout en dos pasos): al tocar "Ir a
 * pagar" la orden ya viaja a la cola del backend, y el checkout solo adjunta
 * nombre/email vía PATCH. Se guarda en sessionStorage junto a una firma del
 * carrito para descartarla si el usuario vuelve atrás y cambia los items.
 */

const KEY = 'nubapay_pending_order'
const MAX_AGE_MS = 10 * 60 * 1000

export interface PendingOrder {
  orderId: string
  slug: string
  itemsKey: string
  createdAt: number
}

/** Firma estable del carrito: cambia si cambian productos o cantidades. */
export function cartItemsKey(items: { productId: string; quantity: number }[]): string {
  return items
    .map(it => `${it.productId}:${it.quantity}`)
    .sort()
    .join('|')
}

export function loadPendingOrder(slug: string, itemsKey: string): PendingOrder | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(KEY)
    if (!raw) return null
    const stored = JSON.parse(raw) as PendingOrder
    if (
      stored.slug !== slug ||
      stored.itemsKey !== itemsKey ||
      Date.now() - stored.createdAt > MAX_AGE_MS
    ) {
      sessionStorage.removeItem(KEY)
      return null
    }
    return stored
  } catch {
    return null
  }
}

export function savePendingOrder(order: PendingOrder): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(order))
  } catch {
    // storage lleno o bloqueado — el checkout cae al flujo clásico
  }
}

export function clearPendingOrder(): void {
  try {
    sessionStorage.removeItem(KEY)
  } catch {
    // noop
  }
}
