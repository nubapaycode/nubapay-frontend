import { arDayKey, formatArDayMonth, formatArDayMonthShort, formatArTime, parseApiDate } from '@/lib/dateTime'
import type { Order } from '@/types'

export type StatusFilter = 'all' | 'unredeemed' | 'partially_delivered' | 'delivered' | 'cancelled'

export const STATUS_TABS: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: 'Todos' },
  { key: 'unredeemed', label: 'Sin retirar' },
  { key: 'partially_delivered', label: 'Entrega parcial' },
  { key: 'delivered', label: 'Entregados' },
  { key: 'cancelled', label: 'Cancelados' },
]

/** Estado del pedido para la UI: punto de color + texto (nunca solo color). */
export const STATUS_UI: Record<string, { label: string; dot: string; badge: string }> = {
  pending: { label: 'Sin retirar', dot: 'bg-amber-400', badge: 'bg-amber-50 text-amber-800' },
  paid: { label: 'Sin retirar', dot: 'bg-amber-400', badge: 'bg-amber-50 text-amber-800' },
  preparing: { label: 'Sin retirar', dot: 'bg-amber-400', badge: 'bg-amber-50 text-amber-800' },
  ready: { label: 'Sin retirar', dot: 'bg-amber-400', badge: 'bg-amber-50 text-amber-800' },
  partially_delivered: { label: 'Entrega parcial', dot: 'bg-violet-400', badge: 'bg-violet-50 text-violet-800' },
  delivered: { label: 'Entregado', dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-800' },
  cancelled: { label: 'Cancelado', dot: 'bg-red-400', badge: 'bg-red-50 text-red-700' },
}

export function statusUi(status: string) {
  return STATUS_UI[status] ?? STATUS_UI.pending
}

export const PAY_LABEL: Record<string, string> = {
  mp: 'Mercado Pago',
  cash: 'Efectivo',
  transfer: 'Transferencia',
}

/** Unidades compradas vs. retiradas. Usa los datos por ítem (`redeemedQuantity`) si están; si no, cae al estado. */
export function scanInfo(order: Order): { units: number; redeemed: number | null } {
  const units = order.items.reduce((s, i) => s + (i.quantity ?? 0), 0)
  if (order.items.some(i => i.redeemedQuantity != null)) {
    return { units, redeemed: order.items.reduce((s, i) => s + (i.redeemedQuantity ?? 0), 0) }
  }
  if (order.status === 'delivered') return { units, redeemed: units }
  if (order.status === 'partially_delivered') return { units, redeemed: null }
  return { units, redeemed: 0 }
}

/** "hace 4 min" para lo reciente; "26/10 · 14:32" para lo anterior a hoy (hora argentina, 24 h). */
export function relativeTime(iso: string, now: number): string {
  const d = parseApiDate(iso)
  const t = d.getTime()
  if (Number.isNaN(t)) return '—'
  const mins = Math.floor((now - t) / 60_000)
  if (mins < 1) return 'recién'
  if (mins < 60) return `hace ${mins} min`
  if (arDayKey(new Date(now)) === arDayKey(d)) return formatArTime(d)
  return `${formatArDayMonth(d)} · ${formatArTime(d)}`
}

export function fullDateTime(iso: string): string {
  const d = parseApiDate(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return `${formatArDayMonthShort(d)} · ${formatArTime(d)}`
}

export function itemsSummary(order: Order): string {
  return order.items.map(i => `${i.name}${i.quantity > 1 ? ` ×${i.quantity}` : ''}`).join(', ')
}

export function initials(name?: string | null): string {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase()
}
