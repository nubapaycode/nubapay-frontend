/** Tokens de gráficos del admin. Debe coincidir con `--color-admin-surface` de globals.css. */
export const SURFACE = '#0e1219'

export const INK = {
  primary: '#eef2f8',
  secondary: '#c0cada',
  muted: '#8e9bb0',
  grid: '#1b212c',
  axis: '#2c3442',
}

/** Slots categóricos en orden fijo (dark). El color sigue a la entidad, no a su ranking. */
export const SERIES = {
  blue: '#4f9bff',
  orange: '#d95926',
  aqua: '#199e70',
  yellow: '#c98500',
  other: '#8e9bb0',
}

/** Escalón ordinal (embudo): más claro = más avanzado en el flujo. */
export const FUNNEL_STEPS = ['#1c5cab', '#4a94f0', '#8fbdf4']

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
