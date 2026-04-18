'use client'

import { useState } from 'react'
import Image from 'next/image'
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
      {/* Hero */}
      <div className="relative h-[200px] sm:h-[340px] md:h-[364px] lg:h-[420px] overflow-hidden">
        <Image
          src="/images/Frame.jpg"
          alt={event.name}
          fill
          className="object-cover object-center"
          sizes="100vw"
          priority
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative h-full flex flex-col justify-end p-5 md:p-8 max-w-5xl mx-auto pb-[32px] md:pb-[30px]">
          <h1 className="text-2xl md:text-4xl font-bold text-white leading-tight">{event.name}</h1>
          <p className="hidden md:block text-sm text-gray-300 mt-1">{event.venue}</p>
        </div>
      </div>

      {/* Contenido */}
      <div className="p-4 md:p-8 max-w-5xl mx-auto">
        <CategoryFilter
          categories={categories}
          active={activeCategory}
          onChange={setActiveCategory}
        />

        <div className="mt-4">
          {activeCategory !== 'combos' && filteredProducts.length > 0 && (
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

          {(activeCategory === 'all' || activeCategory === 'combos') && event.combos.length > 0 && (
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
      </div>

      <FloatingCart count={count} total={total} eventId={event.id} />
    </>
  )
}
