/** Tokens del admin (dark). Los colores de datos son la paleta categórica validada sobre #12121A. */
export const SURFACE = '#12121A'

export const INK = {
  primary: '#f0efec',
  secondary: '#c3c2b7',
  muted: '#898781',
  grid: '#2c2c2a',
  axis: '#383835',
}

/** Slots categóricos en orden fijo (dark). El color sigue a la entidad, no a su ranking. */
export const SERIES = {
  blue: '#3987e5',
  orange: '#d95926',
  aqua: '#199e70',
  yellow: '#c98500',
  other: '#898781',
}

/** Escalón ordinal (embudo): más claro = más avanzado en el flujo. */
export const FUNNEL_STEPS = ['#1c5cab', '#3987e5', '#86b6ef']

export const PROVIDER_COLOR: Record<string, string> = {
  mercadopago: SERIES.blue,
  sipago: SERIES.orange,
  cash: SERIES.aqua,
  transfer: SERIES.yellow,
}

export const PROVIDER_LABEL: Record<string, string> = {
  mercadopago: 'Mercado Pago',
  sipago: 'Sipago',
  cash: 'Efectivo',
  transfer: 'Transferencia',
  stripe: 'Stripe',
}

export function providerColor(p: string): string {
  return PROVIDER_COLOR[p] ?? SERIES.other
}

export function providerLabel(p: string): string {
  return PROVIDER_LABEL[p] ?? p
}

/** Estados de orden tal como están en la DB. */
export const ORDER_STATUS_LABEL: Record<string, string> = {
  queued: 'En cola',
  pending_payment: 'Esperando pago',
  paid: 'Pagada',
  partially_delivered: 'Retiro parcial',
  delivered: 'Retirada',
  cancelled: 'Cancelada',
  failed: 'Falló',
}

export const PAYMENT_STATUS_LABEL: Record<string, string> = {
  pending: 'Pendiente',
  approved: 'Aprobado',
  rejected: 'Rechazado',
  refunded: 'Reembolsado',
  paid: 'Pagado',
}

export const EVENT_STATUS_LABEL: Record<string, string> = {
  draft: 'Borrador',
  active: 'Activo',
  paused: 'Pausado',
  finished: 'Finalizado',
  cancelled: 'Cancelado',
}
