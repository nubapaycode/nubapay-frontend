'use client'

import { useState, useEffect } from 'react'
import type { Order } from '@/types'
import { mockOrders } from '@/lib/mock/orders'

const RANDOM_ITEMS = [
  { productId: 'p1', name: 'Hamburguesa Clásica', price: 3500, quantity: 1 },
  { productId: 'p2', name: 'Pizza de Muzzarella', price: 2800, quantity: 1 },
  { productId: 'p3', name: 'Empanadas x3', price: 2200, quantity: 1 },
  { productId: 'p4', name: 'Gaseosa 500ml', price: 1200, quantity: 1 },
  { productId: 'p5', name: 'Agua Mineral 500ml', price: 800, quantity: 1 },
  { productId: 'c1', name: 'Combo Clásico', price: 4200, quantity: 1 },
  { productId: 'c2', name: 'Combo Familiar', price: 4400, quantity: 1 },
]

function generateOrder(): Order {
  const item = RANDOM_ITEMS[Math.floor(Math.random() * RANDOM_ITEMS.length)]
  const now = new Date().toISOString()
  return {
    id: crypto.randomUUID(),
    eventId: 'demo-event',
    items: [item],
    total: item.price,
    status: 'pending',
    qrToken: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
  }
}

export function useDashboard(): { orders: Order[] } {
  const [orders, setOrders] = useState<Order[]>(mockOrders)

  useEffect(() => {
    const interval = setInterval(() => {
      setOrders(prev => [...prev, generateOrder()])
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  return { orders }
}
