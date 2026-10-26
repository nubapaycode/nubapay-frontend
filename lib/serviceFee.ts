import type { CartItem, ServiceFeePercent } from '@/types'

/**
 * Sin costo de servicio. Es el valor por defecto: el backend manda los porcentajes del evento
 * (5% tickets / 2% productos si el admin activó el costo de servicio, 0 si el evento usa comisión).
 */
export const NO_SERVICE_FEE: ServiceFeePercent = { ticket: 0, product: 0 }

export interface CartTotals {
  ticketsSubtotal: number
  productsSubtotal: number
  serviceFee: number
  total: number
}

/** Porcentaje del monto en centavos, redondeando mitades hacia arriba (igual que Decimal ROUND_HALF_UP del backend). */
function percentOfCents(cents: number, percent: number): number {
  return Math.floor((cents * percent + 50) / 100)
}

/**
 * Subtotales, costo de servicio y total del carrito.
 * El backend recalcula todo al crear el pedido: esto es solo para mostrar el desglose al comprador.
 */
export function computeCartTotals(
  items: Pick<CartItem, 'kind' | 'price' | 'quantity'>[],
  percent: ServiceFeePercent = NO_SERVICE_FEE,
): CartTotals {
  let ticketCents = 0
  let productCents = 0
  for (const it of items) {
    const cents = Math.round(it.price * 100) * it.quantity
    if (it.kind === 'ticket') ticketCents += cents
    else productCents += cents
  }
  const feeCents = percentOfCents(ticketCents, percent.ticket) + percentOfCents(productCents, percent.product)
  return {
    ticketsSubtotal: ticketCents / 100,
    productsSubtotal: productCents / 100,
    serviceFee: feeCents / 100,
    total: (ticketCents + productCents + feeCents) / 100,
  }
}

/** Línea del body de `POST /orders`: tickets viajan como `ticket_id`, el resto como `product_id`. */
export function orderLinePayload(item: Pick<CartItem, 'kind' | 'productId' | 'quantity'>) {
  return item.kind === 'ticket'
    ? { ticket_id: item.productId, quantity: item.quantity }
    : { product_id: item.productId, quantity: item.quantity }
}
