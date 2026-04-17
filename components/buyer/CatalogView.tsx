'use client'

import { useState } from 'react'
import { useCart } from '@/lib/hooks/useCart'
import { CategoryFilter } from './CategoryFilter'
import { CatalogSection } from './CatalogSection'
import { ProductCard } from './ProductCard'
import { ComboCard } from './ComboCard'
import { FloatingCart } from './FloatingCart'
import type { Event } from '@/types'

interface CatalogViewProps {
  event: Event
}

export function CatalogView({ event }: CatalogViewProps) {
  const [activeCategory, setActiveCategory] = useState('all')
  const { items, addItem, updateQuantity, total, count } = useCart()

  const categories = [...new Set(event.products.map(p => p.category))]

  const filteredProducts =
    activeCategory === 'all'
      ? event.products
      : event.products.filter(p => p.category === activeCategory)

  const getQuantity = (id: string) =>
    items.find(i => i.productId === id)?.quantity ?? 0

  return (
    <>
      <div className="mb-4">
        <h1 className="text-2xl font-bold">{event.name}</h1>
        <p className="text-sm text-gray-500">{event.venue}</p>
      </div>

      <CategoryFilter
        categories={categories}
        active={activeCategory}
        onChange={setActiveCategory}
      />

      <div className="mt-4">
        {filteredProducts.length > 0 && (
          <CatalogSection title="Productos">
            {filteredProducts.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                quantity={getQuantity(product.id)}
                onAdd={addItem}
                onUpdateQuantity={updateQuantity}
              />
            ))}
          </CatalogSection>
        )}

        {activeCategory === 'all' && event.combos.length > 0 && (
          <CatalogSection title="Combos">
            {event.combos.map(combo => (
              <ComboCard
                key={combo.id}
                combo={combo}
                quantity={getQuantity(combo.id)}
                onAdd={addItem}
                onUpdateQuantity={updateQuantity}
              />
            ))}
          </CatalogSection>
        )}
      </div>

      <FloatingCart count={count} total={total} eventId={event.id} />
    </>
  )
}
