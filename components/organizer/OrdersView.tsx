'use client'

import { useState } from 'react'
import { mockOrders } from '@/lib/mock/orders'
import { OrderKanban } from './OrderKanban'
import type { Order } from '@/types'

export function OrdersView() {
  const [orders, setOrders] = useState<Order[]>(mockOrders)

  const handleMarkReady = (id: string) => {
    setOrders(prev =>
      prev.map(o => (o.id === id ? { ...o, status: 'ready' as const } : o))
    )
  }

  const handleMarkDelivered = (id: string) => {
    setOrders(prev =>
      prev.map(o => (o.id === id ? { ...o, status: 'delivered' as const } : o))
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Pedidos</h1>
      <OrderKanban
        orders={orders}
        onMarkReady={handleMarkReady}
        onMarkDelivered={handleMarkDelivered}
      />
    </div>
  )
}
