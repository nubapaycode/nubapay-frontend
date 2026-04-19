import type { Order, OrderStatus } from '@/types'
import { OrderCard } from './OrderCard'

interface Column {
  key: OrderStatus
  label: string
  dot: string
}

const COLUMNS: Column[] = [
  { key: 'pending', label: 'Pendiente', dot: 'bg-amber-400' },
  { key: 'preparing', label: 'En preparación', dot: 'bg-blue-400' },
  { key: 'ready', label: 'Listo', dot: 'bg-green-400' },
  { key: 'delivered', label: 'Entregado', dot: 'bg-gray-300' },
]

interface OrderKanbanProps {
  orders: Order[]
  onMarkReady: (id: string) => void
  onMarkDelivered: (id: string) => void
}

export function OrderKanban({ orders, onMarkReady, onMarkDelivered }: OrderKanbanProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      {COLUMNS.map(col => {
        const colOrders = orders.filter(o => o.status === col.key)
        return (
          <div key={col.key} className="flex flex-col gap-3">
            <div className="flex items-center gap-2 px-1">
              <span className={`w-2 h-2 rounded-full shrink-0 ${col.dot}`} />
              <h2 className="text-sm font-medium text-gray-700">{col.label}</h2>
              <span className="ml-auto text-xs text-gray-400">{colOrders.length}</span>
            </div>
            <div className="flex flex-col gap-2">
              {colOrders.map(order => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onMarkReady={
                    col.key === 'pending' || col.key === 'preparing'
                      ? () => onMarkReady(order.id)
                      : undefined
                  }
                  onMarkDelivered={
                    col.key === 'ready' ? () => onMarkDelivered(order.id) : undefined
                  }
                />
              ))}
              {colOrders.length === 0 && (
                <div className="rounded-2xl border border-dashed border-gray-100 p-4 text-center">
                  <p className="text-xs text-gray-300">Sin pedidos</p>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
