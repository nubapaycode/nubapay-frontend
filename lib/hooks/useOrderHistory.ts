'use client'

import { useEffect, useState } from 'react'

export interface SavedOrder {
  orderId: string
  orderNumber: number | null
  slug: string
  total: number
  createdAt: string
}

const STORAGE_KEY = 'nubapay-order-history'
const MAX_ORDERS = 30

function readOrders(): SavedOrder[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as SavedOrder[]) : []
  } catch {
    return []
  }
}

export function saveOrder(order: SavedOrder): void {
  try {
    const existing = readOrders().filter(o => o.orderId !== order.orderId)
    localStorage.setItem(STORAGE_KEY, JSON.stringify([order, ...existing].slice(0, MAX_ORDERS)))
  } catch {}
}

export function useOrderHistory(slug: string) {
  const [orders, setOrders] = useState<SavedOrder[]>([])

  useEffect(() => {
    setOrders(readOrders().filter(o => o.slug === slug))
  }, [slug])

  return orders
}
