'use client'

import { useState } from 'react'
import { mockEvent } from '@/lib/mock/event'
import { formatPrice } from '@/lib/utils'
import type { Product, Combo } from '@/types'

export function ProductsView() {
  const [products, setProducts] = useState<Product[]>(mockEvent.products)
  const [combos, setCombos] = useState<Combo[]>(mockEvent.combos)

  const toggleProduct = (id: string) => {
    setProducts(prev =>
      prev.map(p => (p.id === id ? { ...p, available: !p.available } : p))
    )
  }

  const toggleCombo = (id: string) => {
    setCombos(prev =>
      prev.map(c => (c.id === id ? { ...c, available: !c.available } : c))
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Productos</h1>

      <section className="mb-6">
        <h2 className="text-sm font-semibold text-gray-500 mb-3">Productos</h2>
        <div className="flex flex-col gap-2">
          {products.map(product => (
            <div
              key={product.id}
              className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center justify-between"
            >
              <div>
                <p className={`font-medium text-sm ${!product.available ? 'text-gray-400' : 'text-gray-900'}`}>
                  {product.name}
                </p>
                <p className="text-xs text-gray-500">{formatPrice(product.price)}</p>
              </div>
              <input
                type="checkbox"
                checked={product.available}
                onChange={() => toggleProduct(product.id)}
                className="w-4 h-4 accent-gray-900"
              />
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-gray-500 mb-3">Combos</h2>
        <div className="flex flex-col gap-2">
          {combos.map(combo => (
            <div
              key={combo.id}
              className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center justify-between"
            >
              <div>
                <p className={`font-medium text-sm ${!combo.available ? 'text-gray-400' : 'text-gray-900'}`}>
                  {combo.name}
                </p>
                <p className="text-xs text-gray-500">{formatPrice(combo.price)}</p>
              </div>
              <input
                type="checkbox"
                checked={combo.available}
                onChange={() => toggleCombo(combo.id)}
                className="w-4 h-4 accent-gray-900"
              />
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
