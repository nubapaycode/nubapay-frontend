'use client'

import type { Order } from '@/types'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { formatPrice } from '@/lib/utils'

interface OrderCardProps {
  order: Order
  onMarkReady?: () => void
  onMarkDelivered?: () => void
}

export function OrderCard({ order, onMarkReady, onMarkDelivered }: OrderCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 flex flex-col gap-2">
      <p className="text-xs font-mono text-gray-500">#{order.id.slice(0, 8)}</p>

      <div className="flex flex-col gap-0.5">
        {order.items.map(item => (
          <p key={item.productId} className="text-xs text-gray-700">
            {item.name} ×{item.quantity}
          </p>
        ))}
      </div>

      <p className="text-sm font-bold">{formatPrice(order.total)}</p>

      <div className="mt-1">
        {(order.status === 'pending' || order.status === 'preparing') && onMarkReady && (
          <Button size="sm" className="w-full" onClick={onMarkReady}>
            Marcar listo
          </Button>
        )}
        {order.status === 'ready' && onMarkDelivered && (
          <Button
            size="sm"
            className="w-full bg-green-600 hover:bg-green-700"
            onClick={onMarkDelivered}
          >
            Confirmar entrega
          </Button>
        )}
        {order.status === 'delivered' && (
          <Badge variant="success">Entregado ✓</Badge>
        )}
      </div>
    </div>
  )
}
