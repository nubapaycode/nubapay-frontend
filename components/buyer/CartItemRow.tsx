'use client'

import type { CartItem } from '@/types'
import { Button } from '@/components/ui/Button'
import { formatPrice } from '@/lib/utils'

interface CartItemRowProps {
  item: CartItem
  onUpdateQuantity: (productId: string, quantity: number) => void
}

export function CartItemRow({ item, onUpdateQuantity }: CartItemRowProps) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-gray-100 last:border-0">
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{item.name}</p>
        <p className="text-xs text-gray-500">{formatPrice(item.price)}</p>
      </div>
      <div className="flex items-center gap-1">
        <Button
          size="sm"
          variant="secondary"
          onClick={() => onUpdateQuantity(item.productId, item.quantity - 1)}
        >
          −
        </Button>
        <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
        <Button
          size="sm"
          onClick={() => onUpdateQuantity(item.productId, item.quantity + 1)}
        >
          +
        </Button>
      </div>
      <p className="text-sm font-bold w-20 text-right">
        {formatPrice(item.price * item.quantity)}
      </p>
    </div>
  )
}
