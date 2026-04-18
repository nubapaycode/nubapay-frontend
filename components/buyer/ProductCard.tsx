'use client'

import type { Product } from '@/types'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { formatPrice } from '@/lib/utils'

interface ProductCardProps {
  product: Product
  quantity: number
  onAdd: (product: Product) => void
  onUpdateQuantity: (productId: string, quantity: number) => void
}

export function ProductCard({ product, quantity, onAdd, onUpdateQuantity }: ProductCardProps) {
  return (
    <div className="rounded-xl bg-white border border-gray-100 shadow-sm overflow-hidden flex flex-col">
      <div className="aspect-[4/3] bg-gray-100 flex items-center justify-center">
        <span className="text-3xl">🍽️</span>
      </div>
      <div className="p-2.5 flex flex-col flex-1">
        <h3 className="font-semibold text-xs leading-tight line-clamp-1">{product.name}</h3>
        <p className="text-xs text-gray-400 mt-0.5 line-clamp-1 flex-1">{product.description}</p>
        <span className="font-bold text-xs mt-2 block">{formatPrice(product.price)}</span>
        <div className="mt-1.5">
          {quantity === 0 ? (
            <Button size="sm" className="w-full" onClick={() => onAdd(product)}>
              Agregar
            </Button>
          ) : (
            <div className="flex items-center justify-between gap-1">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => onUpdateQuantity(product.id, quantity - 1)}
              >
                −
              </Button>
              <span className="text-xs font-medium">{quantity}</span>
              <Button
                size="sm"
                onClick={() => onUpdateQuantity(product.id, quantity + 1)}
              >
                +
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
