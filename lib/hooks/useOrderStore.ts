'use client'

import type { CartItem } from '@/types'

interface StoredOrder {
  orderId: string
  items: CartItem[]
  total: number
  paymentMethod: string
  createdAt: string
}

const KEY = 'nubapay_orders'

export function saveOrder(order: StoredOrder) {
  try {
    const existing = getOrders()
    existing[order.orderId] = order
    localStorage.setItem(KEY, JSON.stringify(existing))
  } catch {}
}

export function getOrders(): Record<string, StoredOrder> {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

export function getOrder(orderId: string): StoredOrder | null {
  return getOrders()[orderId] ?? null
}
