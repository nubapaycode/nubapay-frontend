'use client'

import type { Combo } from '@/types'
import { Button } from '@/components/ui/Button'
import { formatPrice } from '@/lib/utils'

interface ComboCardProps {
  combo: Combo
  quantity: number
  onAdd: (combo: Combo) => void
  onUpdateQuantity: (comboId: string, quantity: number) => void
}

export function ComboCard({ combo, quantity, onAdd, onUpdateQuantity }: ComboCardProps) {
  const includedNames = combo.products.map(p => p.name).join(', ')

  return (
    <div className="rounded-xl bg-white border border-gray-100 shadow-sm overflow-hidden flex flex-col">
      <div className="aspect-square bg-amber-50 flex items-center justify-center">
        <span className="text-4xl">🎁</span>
      </div>
      <div className="p-3 flex flex-col flex-1">
        <h3 className="font-semibold text-sm leading-tight line-clamp-2">{combo.name}</h3>
        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{combo.description}</p>
        <p className="text-xs text-gray-400 mt-1 flex-1">Incluye: {includedNames}</p>
        <div className="flex items-center justify-between mt-2">
          <span className="font-bold text-sm">{formatPrice(combo.price)}</span>
          {quantity === 0 ? (
            <Button size="sm" onClick={() => onAdd(combo)}>
              Agregar
            </Button>
          ) : (
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => onUpdateQuantity(combo.id, quantity - 1)}
              >
                −
              </Button>
              <span className="w-6 text-center text-sm font-medium">{quantity}</span>
              <Button
                size="sm"
                onClick={() => onUpdateQuantity(combo.id, quantity + 1)}
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
