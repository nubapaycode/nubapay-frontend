'use client'

import { useState } from 'react'
import { mockOrders } from '@/lib/mock/orders'
import { OrderKanban } from './OrderKanban'
import type { Order } from '@/types'

export function OrdersView() {
  const [orders, setOrders] = useState<Order[]>(mockOrders)

  const handleMarkReady = (id: string) => {
    setOrders(prev => prev.map(o => (o.id === id ? { ...o, status: 'ready' as const } : o)))
  }

  const handleMarkDelivered = (id: string) => {
    setOrders(prev => prev.map(o => (o.id === id ? { ...o, status: 'delivered' as const } : o)))
  }

  return (
    <div className="max-w-6xl">
      <h1 className="text-xl font-medium text-gray-900 mb-6 md:-mt-5">Pedidos</h1>
      <OrderKanban
        orders={orders}
        onMarkReady={handleMarkReady}
        onMarkDelivered={handleMarkDelivered}
      />
    </div>
  )
}
