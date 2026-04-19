'use client'

import type { CartItem } from '@/types'
import { formatPrice } from '@/lib/utils'

interface CartItemRowProps {
  item: CartItem
  onUpdateQuantity: (productId: string, quantity: number) => void
}

export function CartItemRow({ item, onUpdateQuantity }: CartItemRowProps) {
  return (
    <div className="flex items-center gap-3 py-3.5 border-b border-gray-50 last:border-0">
      <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 text-lg">
        🍽️
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{item.name}</p>
        <p className="text-xs text-gray-500 font-semibold mt-0.5">{formatPrice(item.price * item.quantity)}</p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={() => onUpdateQuantity(item.productId, item.quantity - 1)}
          className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 text-sm font-medium transition-colors"
        >
          −
        </button>
        <span className="w-5 text-center text-sm font-semibold">{item.quantity}</span>
        <button
          onClick={() => onUpdateQuantity(item.productId, item.quantity + 1)}
          className="w-7 h-7 rounded-full bg-gray-900 flex items-center justify-center text-white hover:bg-gray-700 text-sm font-medium transition-colors"
        >
          +
        </button>
      </div>
    </div>
  )
}
