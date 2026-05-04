'use client'

import type { Order, OrderStatus } from '@/types'
import { formatDate, formatPrice } from '@/lib/utils'

const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: 'Pendiente',
  preparing: 'En preparación',
  ready: 'Listo',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
}

const STATUS_BADGE: Record<OrderStatus, string> = {
  pending: 'bg-amber-100 text-amber-800',
  preparing: 'bg-blue-100 text-blue-800',
  ready: 'bg-green-100 text-green-800',
  delivered: 'bg-gray-100 text-gray-600',
  cancelled: 'bg-red-100 text-red-800',
}

const paymentLabels: Record<string, string> = {
  mp: 'Mercado Pago',
  cash: 'Efectivo',
  transfer: 'Transferencia',
}

function itemsSummary(order: Order, maxLen = 72): string {
  const s = order.items.map(i => `${i.name} ×${i.quantity}`).join(' · ')
  if (s.length <= maxLen) return s
  return `${s.slice(0, maxLen - 1)}…`
}

interface OrderListProps {
  orders: Order[]
  onMarkReady: (id: string) => void
  onMarkDelivered: (id: string) => void
}

export function OrderList({ orders, onMarkReady, onMarkDelivered }: OrderListProps) {
  if (orders.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-4 py-12 text-center">
        <p className="text-sm text-gray-400">No hay pedidos que coincidan con los filtros.</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden">
      <div className="hidden md:grid md:grid-cols-[minmax(0,1fr)_auto_auto_auto_auto] md:gap-3 md:px-4 md:py-2 md:bg-gray-50 md:text-[11px] md:font-medium md:uppercase md:tracking-wide md:text-gray-400">
        <span>Pedido</span>
        <span className="text-right">Estado</span>
        <span className="text-right whitespace-nowrap">Total</span>
        <span className="text-right whitespace-nowrap">Pago</span>
        <span className="text-right">Acciones</span>
      </div>
      <ul className="divide-y divide-gray-50">
        {orders.map(order => (
          <li key={order.id}>
            <div className="flex flex-col gap-3 px-4 py-4 md:grid md:grid-cols-[minmax(0,1fr)_auto_auto_auto_auto] md:items-center md:gap-3 md:py-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="text-xs font-mono text-gray-500">
                    #{order.id.slice(0, 8).toUpperCase()}
                  </span>
                  <span className="text-[11px] text-gray-400 whitespace-nowrap">
                    {order.createdAt ? formatDate(order.createdAt) : ''}
                  </span>
                </div>
                <p className="text-sm text-gray-800 mt-1 line-clamp-2 md:line-clamp-1">{itemsSummary(order)}</p>
              </div>
              <div className="flex md:contents flex-wrap items-center justify-between gap-2">
                <span
                  className={`inline-flex md:justify-end items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_BADGE[order.status]}`}
                >
                  {STATUS_LABEL[order.status]}
                </span>
                <p className="text-sm font-medium text-gray-900 md:text-right tabular-nums whitespace-nowrap">
                  {formatPrice(order.total)}
                </p>
                {order.paymentMethod ? (
                  <p className="text-[11px] text-gray-400 md:text-right whitespace-nowrap hidden md:block">
                    {paymentLabels[order.paymentMethod] ?? order.paymentMethod}
                  </p>
                ) : (
                  <span className="text-[11px] text-gray-300 md:text-right hidden md:block">—</span>
                )}
                <div className="flex flex-wrap justify-end gap-2">
                  {(order.status === 'pending' || order.status === 'preparing') && (
                    <button
                      type="button"
                      onClick={() => onMarkReady(order.id)}
                      className="text-xs font-medium bg-gray-900 text-white rounded-full px-3 py-1.5 hover:bg-gray-700 transition-colors"
                    >
                      Marcar listo
                    </button>
                  )}
                  {order.status === 'ready' && (
                    <button
                      type="button"
                      onClick={() => onMarkDelivered(order.id)}
                      className="text-xs font-medium bg-green-600 text-white rounded-full px-3 py-1.5 hover:bg-green-700 transition-colors"
                    >
                      Confirmar entrega
                    </button>
                  )}
                  {order.status === 'delivered' && (
                    <span className="text-xs font-medium text-green-600 self-center">Entregado ✓</span>
                  )}
                  {order.status === 'cancelled' && (
                    <span className="text-xs text-gray-400 self-center">—</span>
                  )}
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
