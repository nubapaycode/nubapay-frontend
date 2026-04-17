import type { Order, OrderStatus } from '@/types'
import { cn } from '@/lib/utils'
import { OrderCard } from './OrderCard'

interface Column {
  key: OrderStatus
  label: string
  headerClass: string
}

const COLUMNS: Column[] = [
  { key: 'pending', label: 'Pendiente', headerClass: 'bg-gray-100' },
  { key: 'preparing', label: 'En preparación', headerClass: 'bg-yellow-50' },
  { key: 'ready', label: 'Listo', headerClass: 'bg-green-50' },
  { key: 'delivered', label: 'Entregado', headerClass: 'bg-gray-50' },
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
            <div className={cn('rounded-lg px-3 py-2', col.headerClass)}>
              <h2 className="font-semibold text-sm">{col.label}</h2>
              <p className="text-xs text-gray-500">
                {colOrders.length} {colOrders.length === 1 ? 'pedido' : 'pedidos'}
              </p>
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
            </div>
          </div>
        )
      })}
    </div>
  )
}
