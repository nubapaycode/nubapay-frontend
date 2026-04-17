// lib/hooks/useCart.ts
'use client'

import { useState, useEffect } from 'react'
import type { CartItem, Product, Combo } from '@/types'

const CART_KEY = 'nubapay_cart'

interface UseCart {
  items: CartItem[]
  addItem: (item: Product | Combo) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  total: number
  count: number
}

export function useCart(): UseCart {
  const [items, setItems] = useState<CartItem[]>([])

  useEffect(() => {
    try {
      const stored = localStorage.getItem(CART_KEY)
      if (stored) setItems(JSON.parse(stored))
    } catch {
      // ignore malformed data
    }
  }, [])

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(items))
  }, [items])

  const addItem = (item: Product | Combo) => {
    setItems(prev => {
      const existing = prev.find(i => i.productId === item.id)
      if (existing) {
        return prev.map(i =>
          i.productId === item.id ? { ...i, quantity: i.quantity + 1 } : i
        )
      }
      return [
        ...prev,
        {
          productId: item.id,
          name: item.name,
          price: item.price,
          quantity: 1,
          imageUrl: item.imageUrl,
        },
      ]
    })
  }

  const removeItem = (productId: string) => {
    setItems(prev => prev.filter(i => i.productId !== productId))
  }

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId)
      return
    }
    setItems(prev =>
      prev.map(i => (i.productId === productId ? { ...i, quantity } : i))
    )
  }

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const count = items.reduce((sum, item) => sum + item.quantity, 0)

  return { items, addItem, removeItem, updateQuantity, total, count }
}
