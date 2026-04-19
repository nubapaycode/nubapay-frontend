'use client'

import Image from 'next/image'
import type { Combo } from '@/types'
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
    <div className="rounded-2xl bg-white border border-gray-100 overflow-hidden flex flex-col">
      {/* Imagen */}
      <div className="aspect-[8/7] bg-amber-50 relative overflow-hidden rounded-b-2xl">
        {combo.imageUrl ? (
          <Image
            src={combo.imageUrl}
            alt={combo.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 50vw, 25vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl">🎁</div>
        )}

        {/* Botón + / contador en esquina */}
        <div className="absolute bottom-2 right-2">
          {quantity === 0 ? (
            <button
              onClick={() => onAdd(combo)}
              className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-gray-900 shadow-md hover:bg-gray-50 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
            </button>
          ) : (
            <div className="flex items-center gap-2 bg-white rounded-full px-2.5 py-1.5 shadow-md">
              <button
                onClick={() => onUpdateQuantity(combo.id, quantity - 1)}
                className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-900 text-sm font-bold"
              >
                −
              </button>
              <span className="text-gray-900 text-sm font-bold min-w-[14px] text-center">{quantity}</span>
              <button
                onClick={() => onUpdateQuantity(combo.id, quantity + 1)}
                className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-900 text-sm font-bold"
              >
                +
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="p-3 border-t border-gray-100">
        <h3 className="font-semibold text-sm leading-tight line-clamp-1 text-gray-900">{combo.name}</h3>
        <p className="text-xs text-gray-400 line-clamp-1 mt-0.5">Incluye: {includedNames}</p>
        <span className="font-bold text-sm text-gray-900 mt-2 block">{formatPrice(combo.price)}</span>
      </div>
    </div>
  )
}
