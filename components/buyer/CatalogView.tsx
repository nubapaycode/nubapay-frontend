'use client'

import type { ReactNode } from 'react'
import { useState } from 'react'
import Image from 'next/image'
import { buyerFlowPath } from '@/lib/buyerRoutes'
import { BUYER_COLORS, BUYER_FONT } from '@/lib/buyerUi'
import { useCart } from '@/lib/hooks/useCart'
import { CategoryFilter } from './CategoryFilter'
import { CategorySheet } from './CategorySheet'
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

type SortOrder = 'default' | 'asc' | 'desc'

function sortItems<T extends { price: number; available?: boolean }>(items: T[], order: SortOrder): T[] {
  const sorted = order === 'default' ? [...items] : [...items].sort((a, b) => order === 'asc' ? a.price - b.price : b.price - a.price)
  return sorted.sort((a, b) => {
    const aAvail = a.available !== false ? 0 : 1
    const bAvail = b.available !== false ? 0 : 1
    return aAvail - bAvail
  })
}

function SortIcon({ order }: { order: SortOrder }) {
  if (order === 'asc') return <span>↑</span>
  if (order === 'desc') return <span>↓</span>
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden>
      <path d="M6.5 2v9M3.5 4.5l3-3 3 3M3.5 8.5l3 3 3-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function EmptyState({ title, subtitle, icon }: { title: string; subtitle: string; icon: ReactNode }) {
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
  const [sortOrder, setSortOrder] = useState<SortOrder>('default')
  const [sheetOpen, setSheetOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const { items, addItem, updateQuantity, total, count } = useCart()

  const slug = catalogSlug ?? event.id

  const heroSrc = event.coverImageUrl && event.coverImageUrl.trim() !== '' ? event.coverImageUrl : '/images/Frame.jpg'
  const heroRemote = heroSrc.startsWith('http')

  const categories = [...new Set(event.products.map(p => p.category))]
  const promoProducts = event.products.filter(p => p.promoLabel?.trim())

  const counts: Record<string, number> = {
    all: event.products.length + event.combos.length,
    descuentos: promoProducts.length,
    combos: event.combos.length,
    ...Object.fromEntries(categories.map(c => [c, event.products.filter(p => p.category === c).length])),
  }

  const q = searchQuery.trim().toLowerCase()
  const matchesQuery = (name: string) => !q || name.toLowerCase().includes(q)

  const filteredProducts = sortItems(
    (activeCategory === 'all' || activeCategory === 'descuentos'
      ? event.products.filter(p => !p.promoLabel?.trim())
      : event.products.filter(p => p.category === activeCategory && !p.promoLabel?.trim())
    ).filter(p => matchesQuery(p.name)),
    sortOrder,
  )

  const filteredPromos = sortItems(
    (activeCategory === 'all' || activeCategory === 'descuentos'
      ? promoProducts
      : promoProducts.filter(p => p.category === activeCategory)
    ).filter(p => matchesQuery(p.name)),
    sortOrder,
  )

  const filteredCombos = sortItems(event.combos.filter(c => matchesQuery(c.name)), sortOrder)

  const hasActiveFilters = activeCategory !== 'all' || sortOrder !== 'default' || q !== ''

  const cycleSortOrder = () => {
    setSortOrder(prev => prev === 'default' ? 'asc' : prev === 'asc' ? 'desc' : 'default')
  }

  const clearFilters = () => {
    setActiveCategory('all')
    setSortOrder('default')
    setSearchQuery('')
  }

  const getQuantity = (id: string) => items.find(i => i.productId === id)?.quantity ?? 0

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

      {/* Barra de filtros sticky */}
      <div
        className="sticky top-0 z-20 bg-white"
        style={{ borderBottom: `1px solid ${BUYER_COLORS.border}` }}
      >
        <div className="mx-auto max-w-5xl px-4 md:px-6">

          {/* Fila 1: búsqueda */}
          <div className="pt-3 pb-2">
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2" style={{ color: BUYER_COLORS.iconMuted }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                  <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.4" />
                  <path d="M10 10l2.5 2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Buscar productos…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full rounded-full py-2 pr-8 text-[13px] outline-none transition-colors"
                style={{
                  paddingLeft: '32px',
                  background: BUYER_COLORS.subtleFill,
                  border: `1px solid ${searchQuery ? BUYER_COLORS.text : BUYER_COLORS.border}`,
                  color: BUYER_COLORS.text,
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: BUYER_COLORS.muted }}
                  aria-label="Limpiar búsqueda"
                >
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                    <path d="M2 2l9 9M11 2l-9 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Fila 2: categoría + sort */}
          <div className="flex items-center gap-3 pb-3">
            {/* Botón categorías */}
            <CategoryFilter
              active={activeCategory}
              onOpen={() => setSheetOpen(true)}
            />

            {/* Botón sort */}
            <button
              type="button"
              onClick={cycleSortOrder}
              className="flex flex-shrink-0 items-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold transition-colors"
              style={
                sortOrder !== 'default'
                  ? { background: BUYER_COLORS.accent, color: BUYER_COLORS.accentText, border: 'none' }
                  : {
                      background: BUYER_COLORS.chipInactiveBg,
                      border: `1px solid ${BUYER_COLORS.chipInactiveBorder}`,
                      color: BUYER_COLORS.text,
                    }
              }
            >
              <SortIcon order={sortOrder} />
              Precio
            </button>

            {/* Banner carrito */}
            {count > 0 && (
              <a
                href={buyerFlowPath(event.id, { catalogSlug, path: 'cart' })}
                className="ml-auto flex flex-shrink-0 items-center gap-1.5 rounded-full px-3 py-2 text-xs font-bold transition-opacity active:opacity-80"
                style={{ background: BUYER_COLORS.accent, color: BUYER_COLORS.accentText }}
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
                  <path d="M1.5 1.5H3l1.5 6h5l1.5-4H5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="5" cy="10" r="0.7" fill="currentColor" />
                  <circle cx="8.5" cy="10" r="0.7" fill="currentColor" />
                </svg>
                {count} {count === 1 ? 'item' : 'items'}
              </a>
            )}
          </div>

          {/* Fila limpiar — solo cuando hay filtros activos */}
          {hasActiveFilters && (
            <div className="flex items-center gap-2 pb-2.5">
              <span className="text-xs" style={{ color: BUYER_COLORS.muted }}>
                {q
                  ? `"${searchQuery}"`
                  : activeCategory !== 'all' && sortOrder !== 'default'
                  ? `${activeCategory === 'all' ? 'Todos' : activeCategory} · ${sortOrder === 'asc' ? 'menor precio' : 'mayor precio'}`
                  : activeCategory !== 'all'
                  ? activeCategory === 'descuentos' ? 'Descuentos' : activeCategory === 'combos' ? 'Combos' : activeCategory
                  : sortOrder === 'asc' ? 'Menor precio primero' : 'Mayor precio primero'}
              </span>
              <button
                type="button"
                onClick={clearFilters}
                className="text-xs font-semibold underline underline-offset-2"
                style={{ color: BUYER_COLORS.text }}
              >
                Limpiar
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Productos */}
      <div className="mx-auto max-w-5xl px-4 pb-10 pt-5 md:px-6">
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

        {(activeCategory === 'all' || activeCategory === 'combos') && filteredCombos.length > 0 && (
          <CatalogSection title="Combos">
            {filteredCombos.map(combo => (
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

        {activeCategory === 'combos' && filteredCombos.length === 0 && (
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

      <FloatingCart count={count} total={total} eventId={event.id} catalogSlug={catalogSlug} />
      <FloatingOrders eventId={event.id} catalogSlug={catalogSlug} />

      <CategorySheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        categories={categories}
        active={activeCategory}
        onChange={setActiveCategory}
        counts={counts}
      />
    </div>
  )
}
