'use client'

import type { Order } from '@/types'
import { formatPrice } from '@/lib/utils'

interface OrderCardProps {
  order: Order
  onMarkReady?: () => void
  onMarkDelivered?: () => void
}

const paymentLabels: Record<string, string> = {
  mp: 'Mercado Pago', cash: 'Efectivo', transfer: 'Transferencia',
}

export function OrderCard({ order, onMarkReady, onMarkDelivered }: OrderCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-mono text-gray-400">#{order.id.slice(0, 8).toUpperCase()}</p>
        {order.paymentMethod && (
          <span className="text-[10px] text-gray-400 font-medium">{paymentLabels[order.paymentMethod]}</span>
        )}
      </div>

      <div className="flex flex-col gap-1">
        {order.items.map(item => (
          <div key={item.productId} className="flex items-center justify-between">
            <p className="text-xs text-gray-700">{item.name}</p>
            <span className="text-[10px] text-gray-400">×{item.quantity}</span>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-gray-50">
        <p className="text-sm font-medium text-gray-900">{formatPrice(order.total)}</p>
        {(order.status === 'pending' || order.status === 'preparing') && onMarkReady && (
          <button
            onClick={onMarkReady}
            className="text-xs font-medium bg-gray-900 text-white rounded-full px-3 py-1.5 hover:bg-gray-700 transition-colors"
          >
            Marcar listo
          </button>
        )}
        {order.status === 'ready' && onMarkDelivered && (
          <button
            onClick={onMarkDelivered}
            className="text-xs font-medium bg-green-600 text-white rounded-full px-3 py-1.5 hover:bg-green-700 transition-colors"
          >
            Confirmar entrega
          </button>
        )}
        {order.status === 'delivered' && (
          <span className="text-xs font-medium text-green-600">Entregado ✓</span>
        )}
      </div>
    </div>
  )
}
