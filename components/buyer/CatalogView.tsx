'use client'

import type { ReactNode } from 'react'
import { useState } from 'react'
import Image from 'next/image'
import { BUYER_COLORS, BUYER_FONT } from '@/lib/buyerUi'
import { useCart } from '@/lib/hooks/useCart'
import { CategoryFilter } from './CategoryFilter'
import { CatalogSection } from './CatalogSection'
import { ProductCard } from './ProductCard'
import { ComboCard } from './ComboCard'
import { FloatingCart } from './FloatingCart'
import { FloatingOrders } from './FloatingOrders'
import type { Event } from '@/types'

interface CatalogViewProps {
  event: Event
  /** Presente cuando el comprador entró por `/catalogo/:slug` (evita navegar a URLs con UUID). */
  catalogSlug?: string
}

function EmptyState({
  title,
  subtitle,
  icon,
}: {
  title: string
  subtitle: string
  icon: ReactNode
}) {
  return (
    <div className="flex flex-col items-center py-16 px-4 text-center">
      <div
        className="mb-4 flex h-[72px] w-[72px] items-center justify-center rounded-[24px]"
        style={{ background: BUYER_COLORS.subtleFill }}
      >
        {icon}
      </div>
      <p className="mb-1 text-[17px] font-bold tracking-tight text-[#0A0A0F]" style={{ letterSpacing: '-0.02em' }}>
        {title}
      </p>
      <p className="text-sm" style={{ color: BUYER_COLORS.muted }}>
        {subtitle}
      </p>
    </div>
  )
}

export function CatalogView({ event, catalogSlug }: CatalogViewProps) {
  const [activeCategory, setActiveCategory] = useState('all')
  const { items, addItem, updateQuantity, total, count } = useCart()

  const slug = catalogSlug ?? event.id

  const heroSrc = event.coverImageUrl && event.coverImageUrl.trim() !== '' ? event.coverImageUrl : '/images/Frame.jpg'
  const heroRemote = heroSrc.startsWith('http')

  const categories = [...new Set(event.products.map(p => p.category))]

  const promoProducts = event.products.filter(p => p.promoLabel?.trim())

  const filteredProducts =
    activeCategory === 'all' || activeCategory === 'descuentos'
      ? event.products.filter(p => !p.promoLabel?.trim())
      : event.products.filter(p => p.category === activeCategory && !p.promoLabel?.trim())

  const filteredPromos =
    activeCategory === 'all' || activeCategory === 'descuentos'
      ? promoProducts
      : promoProducts.filter(p => p.category === activeCategory)

  const getQuantity = (id: string) =>
    items.find(i => i.productId === id)?.quantity ?? 0

  const stroke = BUYER_COLORS.iconMuted

  return (
    <div style={{ minHeight: '100svh', background: BUYER_COLORS.bg, fontFamily: BUYER_FONT }}>
      {/* Hero */}
      <div className="relative h-[200px] overflow-hidden sm:h-[340px] md:h-[364px] lg:h-[420px]">
        <Image
          src={heroSrc}
          alt={event.name}
          fill
          className="object-cover object-center"
          sizes="100vw"
          priority
          unoptimized={heroRemote}
        />
        <div className="absolute inset-0 bg-black/45" />
        <div className="relative mx-auto flex h-full max-w-5xl flex-col justify-end px-4 pb-6 pt-4 md:px-8 md:pb-8">
          <h1
            className="text-2xl font-bold leading-tight text-white md:text-4xl"
            style={{ letterSpacing: '-0.03em' }}
          >
            {event.name}
          </h1>
          {(event.venue?.trim() || event.description?.trim()) && (
            <p className="mt-1 hidden line-clamp-2 text-sm md:block" style={{ color: 'rgba(255,255,255,0.85)' }}>
              {event.venue?.trim() || event.description?.trim()}
            </p>
          )}
        </div>
      </div>

      {/* Contenido */}
      <div className="mx-auto max-w-5xl px-4 pb-10 pt-5 md:px-6 md:pt-6">
        <CategoryFilter
          categories={categories}
          active={activeCategory}
          onChange={setActiveCategory}
        />

        <div className="mt-5">
          {activeCategory !== 'combos' && filteredPromos.length > 0 && (
            <CatalogSection title="Descuentos">
              {filteredPromos.map(product => (
                <ProductCard
                  key={product.id}
                  product={product}
                  quantity={getQuantity(product.id)}
                  catalogSlug={slug}
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
                  catalogSlug={slug}
                  onAdd={addItem}
                  onUpdateQuantity={updateQuantity}
                />
              ))}
            </CatalogSection>
          )}

          {activeCategory !== 'combos' && activeCategory !== 'descuentos' && filteredProducts.length > 0 && (
            <CatalogSection title="Productos">
              {filteredProducts.map(product => (
                <ProductCard
                  key={product.id}
                  product={product}
                  quantity={getQuantity(product.id)}
                  catalogSlug={slug}
                  onAdd={addItem}
                  onUpdateQuantity={updateQuantity}
                />
              ))}
            </CatalogSection>
          )}

          {activeCategory !== 'combos' && activeCategory !== 'all' && filteredProducts.length === 0 && filteredPromos.length === 0 && (
            <EmptyState
              title="Sin productos en esta categoría"
              subtitle="Probá con otra categoría"
              icon={
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden>
                  <circle cx="14" cy="14" r="7" stroke={stroke} strokeWidth="1.75" />
                  <path d="M19 19l7 7" stroke={stroke} strokeWidth="1.75" strokeLinecap="round" />
                </svg>
              }
            />
          )}

          {activeCategory === 'combos' && event.combos.length === 0 && (
            <EmptyState
              title="Sin combos disponibles"
              subtitle="Este evento todavía no tiene combos"
              icon={
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden>
                  <rect x="5" y="5" width="10" height="10" rx="2" stroke={stroke} strokeWidth="1.75" />
                  <rect x="17" y="5" width="10" height="10" rx="2" stroke={stroke} strokeWidth="1.75" />
                  <rect x="5" y="17" width="10" height="10" rx="2" stroke={stroke} strokeWidth="1.75" />
                  <rect x="17" y="17" width="10" height="10" rx="2" stroke={stroke} strokeWidth="1.75" />
                </svg>
              }
            />
          )}

          {activeCategory === 'all' && filteredProducts.length === 0 && event.combos.length === 0 && (
            <EmptyState
              title="Sin productos disponibles"
              subtitle="El organizador todavía no cargó productos"
              icon={
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden>
                  <path
                    d="M16 4L6 9v12l10 5 10-5V9L16 4z"
                    stroke={stroke}
                    strokeWidth="1.75"
                    strokeLinejoin="round"
                  />
                  <path d="M6 9l10 5 10-5" stroke={stroke} strokeWidth="1.75" strokeLinejoin="round" />
                </svg>
              }
            />
          )}
        </div>
      </div>

      <FloatingCart count={count} total={total} eventId={event.id} catalogSlug={catalogSlug} />
      <FloatingOrders eventId={event.id} catalogSlug={catalogSlug} />
    </div>
  )
}
