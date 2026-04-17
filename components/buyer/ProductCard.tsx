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
      <div className="aspect-square bg-gray-100 flex items-center justify-center">
        <span className="text-4xl">🍽️</span>
      </div>
      <div className="p-3 flex flex-col flex-1">
        <Badge variant="default" className="mb-1 self-start">{product.category}</Badge>
        <h3 className="font-semibold text-sm leading-tight line-clamp-2">{product.name}</h3>
        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2 flex-1">{product.description}</p>
        <div className="flex items-center justify-between mt-2">
          <span className="font-bold text-sm">{formatPrice(product.price)}</span>
          {quantity === 0 ? (
            <Button size="sm" onClick={() => onAdd(product)}>
              Agregar
            </Button>
          ) : (
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => onUpdateQuantity(product.id, quantity - 1)}
              >
                −
              </Button>
              <span className="w-6 text-center text-sm font-medium">{quantity}</span>
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
