import { parkingCheckoutPath, parkingPath, ticketsCheckoutPath, ticketsPath } from '@/lib/buyerRoutes'
import type { Event, Ticket } from '@/types'

/** Tickets y parking se compran igual (mismo checkout y pago); cambian los textos, la lista y las rutas. */
export type PurchaseKind = 'ticket' | 'parking'

export const PURCHASE_COPY: Record<
  PurchaseKind,
  {
    metaTitle: string
    metaCheckoutTitle: string
    metaDescription: string
    metaCheckoutDescription: string
    backLabel: string
    heading: string
    /** Aclaración bajo el título de la lista. */
    headingNote?: string
    noneTitle: string
    noneBody: string
    closed: string
    disabled: string
    countLabel: (n: number) => string
    tableHeader: string
    noSelectionTitle: string
    noSelectionBody: string
    expiredBody: string
    chooseAgain: string
    emailNote: string
    noPaymentMethods: string
  }
> = {
  ticket: {
    metaTitle: 'Tickets',
    metaCheckoutTitle: 'Comprar entradas',
    metaDescription: 'Comprá entradas y tickets de',
    metaCheckoutDescription: 'Completá tus datos y pagá tus entradas.',
    backLabel: 'Volver a las entradas',
    heading: 'Elegí tus entradas',
    noneTitle: 'Sin tickets disponibles',
    noneBody: 'Este evento todavía no tiene entradas a la venta. Volvé a entrar más cerca de la fecha.',
    closed: 'La venta de entradas para este evento está cerrada.',
    disabled: 'Compra inhabilitada temporalmente. No es posible agregar tickets ni pagar en este momento.',
    countLabel: n => `${n} ${n === 1 ? 'entrada' : 'entradas'}`,
    tableHeader: 'Entrada',
    noSelectionTitle: 'No elegiste entradas',
    noSelectionBody: 'Elegí las entradas que querés comprar y volvé a esta página.',
    expiredBody: 'Pasaron los 10 minutos para completar la compra. Volvé a elegir tus entradas para empezar de nuevo.',
    chooseAgain: 'Elegir entradas',
    emailNote: 'Te enviamos las entradas a este email.',
    noPaymentMethods: 'Este evento todavía no tiene medios de pago para entradas.',
  },
  parking: {
    metaTitle: 'Parking',
    metaCheckoutTitle: 'Comprar parking',
    metaDescription: 'Reservá tu lugar de estacionamiento en',
    metaCheckoutDescription: 'Completá tus datos y pagá tu lugar de estacionamiento.',
    backLabel: 'Volver al parking',
    heading: 'Elegí tu lugar',
    headingNote: 'Podés reservar un solo lugar por compra: auto, moto o camión.',
    noneTitle: 'Sin parking disponible',
    noneBody: 'Este evento todavía no tiene lugares de estacionamiento a la venta. Volvé a entrar más cerca de la fecha.',
    closed: 'La venta de parking para este evento está cerrada.',
    disabled: 'Compra inhabilitada temporalmente. No es posible agregar lugares ni pagar en este momento.',
    countLabel: n => `${n} ${n === 1 ? 'lugar' : 'lugares'}`,
    tableHeader: 'Vehículo',
    noSelectionTitle: 'No elegiste un lugar',
    noSelectionBody: 'Elegí el tipo de vehículo y volvé a esta página.',
    expiredBody: 'Pasaron los 10 minutos para completar la compra. Volvé a elegir tu lugar para empezar de nuevo.',
    chooseAgain: 'Elegir lugar',
    emailNote: 'Te enviamos el QR de tu lugar a este email.',
    noPaymentMethods: 'Este evento todavía no tiene medios de pago para parking.',
  },
}

/**
 * Clave con la que se guarda la selección (sessionStorage guarda una sola, por "slug").
 * Parking usa otra para no pisar la selección de entradas del mismo evento.
 */
export function selectionScope(slug: string, kind: PurchaseKind): string {
  return kind === 'parking' ? `${slug}#parking` : slug
}

/** Tope de unidades por compra: parking es un solo lugar (auto, moto o camión). */
export function maxPerPurchase(kind: PurchaseKind): number | null {
  return kind === 'parking' ? 1 : null
}

/** Recorta una selección guardada al tope del tipo (p. ej. una selección vieja con varios lugares). */
export function limitSelection<T extends { quantity: number }>(lines: T[], kind: PurchaseKind): T[] {
  const max = maxPerPurchase(kind)
  if (max === null) return lines
  const out: T[] = []
  let left = max
  for (const line of lines) {
    if (left <= 0) break
    const quantity = Math.min(line.quantity, left)
    out.push(quantity === line.quantity ? line : { ...line, quantity })
    left -= quantity
  }
  return out
}

export function itemsOf(event: Event, kind: PurchaseKind): Ticket[] {
  return kind === 'parking' ? (event.parking ?? []) : event.tickets
}

export function storePath(slug: string, kind: PurchaseKind): string {
  return kind === 'parking' ? parkingPath(slug) : ticketsPath(slug)
}

export function checkoutPath(slug: string, kind: PurchaseKind): string {
  return kind === 'parking' ? parkingCheckoutPath(slug) : ticketsCheckoutPath(slug)
}
