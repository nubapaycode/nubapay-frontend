'use client'

import { useEffect } from 'react'
import { BUYER_COLORS, BUYER_FONT } from '@/lib/buyerUi'

interface CategorySheetProps {
  open: boolean
  onClose: () => void
  categories: string[]
  active: string
  onChange: (category: string) => void
  counts: Record<string, number>
}

const LABELS: Record<string, string> = {
  all: 'Todos',
  descuentos: 'Descuentos',
  combos: 'Combos',
}

function CategoryIcon({ category, active }: { category: string; active: boolean }) {
  const color = active ? BUYER_COLORS.accentText : '#6B6B7A'
  const key = category.toLowerCase()

  // Todos
  if (key === 'all') return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <rect x="2" y="2" width="7" height="7" rx="2" fill={color} />
      <rect x="11" y="2" width="7" height="7" rx="2" fill={color} />
      <rect x="2" y="11" width="7" height="7" rx="2" fill={color} />
      <rect x="11" y="11" width="7" height="7" rx="2" fill={color} />
    </svg>
  )

  // Descuentos
  if (key === 'descuentos') return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path d="M10.5 2.5L17.5 9.5L10.5 17.5H3.5V10.5L10.5 2.5Z" stroke={color} strokeWidth="1.6" strokeLinejoin="round" />
      <circle cx="7" cy="7" r="1.2" fill={color} />
      <path d="M13 12L7 7" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="13" cy="12" r="1.2" fill={color} />
    </svg>
  )

  // Combos / stack
  if (key === 'combos') return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path d="M2 14l8 4 8-4" stroke={color} strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M2 10l8 4 8-4" stroke={color} strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M2 6l8-4 8 4-8 4-8-4Z" stroke={color} strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  )

  // Bebidas / drinks
  if (key.includes('bebida') || key.includes('drink') || key.includes('trago') || key.includes('bar')) return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path d="M5 3h10l-2 7a4 4 0 01-6 0L5 3Z" stroke={color} strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M10 13v4" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
      <path d="M7 17h6" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
      <path d="M5 7h10" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )

  // Comida / food
  if (key.includes('comida') || key.includes('food') || key.includes('plato') || key.includes('almuerzo') || key.includes('cena')) return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path d="M6 2v5a3 3 0 003 3v8" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
      <path d="M14 2v16" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
      <path d="M14 8a3 3 0 01-3-3V2" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
      <path d="M6 7V2" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
      <path d="M8 7V2" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )

  // Snacks
  if (key.includes('snack') || key.includes('picada') || key.includes('entrad')) return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path d="M4 8h12l-1.5 8H5.5L4 8Z" stroke={color} strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M7 8V5a3 3 0 016 0v3" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )

  // Postres / sweets
  if (key.includes('postre') || key.includes('dulce') || key.includes('torta') || key.includes('helado')) return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path d="M10 2c-3 0-5 1.5-5 4s2 4 5 4 5-1.5 5-4-2-4-5-4Z" stroke={color} strokeWidth="1.6" />
      <path d="M5 6v8a5 5 0 0010 0V6" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )

  // Default: bolsa
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path d="M4 7h12l-1.5 10h-9L4 7Z" stroke={color} strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M7.5 7V5.5a2.5 2.5 0 015 0V7" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

export function CategorySheet({ open, onClose, categories, active, onChange, counts }: CategorySheetProps) {
  const allOptions = ['all', 'descuentos', ...categories, 'combos']

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [open])

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px] transition-opacity duration-300"
        style={{ opacity: open ? 1 : 0, pointerEvents: open ? 'auto' : 'none' }}
        onClick={onClose}
        aria-hidden
      />

      {/* Sheet */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Seleccionar categoría"
        className="fixed inset-x-0 bottom-0 z-50 rounded-t-[28px] bg-white shadow-2xl transition-transform duration-300 ease-out"
        style={{
          fontFamily: BUYER_FONT,
          maxHeight: '80dvh',
          transform: open ? 'translateY(0)' : 'translateY(100%)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Handle */}
        <div className="flex flex-shrink-0 justify-center pb-1 pt-3">
          <div className="h-1 w-10 rounded-full bg-black/10" />
        </div>

        {/* Header */}
        <div className="flex flex-shrink-0 items-center justify-between px-5 pb-4 pt-2">
          <span className="text-[18px] font-bold" style={{ color: BUYER_COLORS.text, letterSpacing: '-0.02em' }}>
            Categorías
          </span>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full transition-colors"
            style={{ background: BUYER_COLORS.subtleFill }}
            aria-label="Cerrar"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
              <path d="M2 2l10 10M12 2L2 12" stroke={BUYER_COLORS.text} strokeWidth="1.75" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Lista de categorías */}
        <div className="overflow-y-auto pb-8">
          {allOptions.map(cat => {
            const isActive = active === cat
            const label = LABELS[cat] ?? cat
            const count = counts[cat] ?? 0

            return (
              <button
                key={cat}
                type="button"
                onClick={() => { onChange(cat); onClose() }}
                className="flex w-full items-center gap-4 px-5 py-3 transition-colors active:bg-black/5"
              >
                {/* Icono */}
                <div
                  className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-[14px] transition-colors"
                  style={{ background: isActive ? BUYER_COLORS.accent : BUYER_COLORS.subtleFill }}
                >
                  <CategoryIcon category={cat} active={isActive} />
                </div>

                {/* Nombre */}
                <span
                  className="flex-1 text-left text-[15px] font-semibold"
                  style={{ color: BUYER_COLORS.text }}
                >
                  {label}
                </span>

                {/* Badge cantidad */}
                <span
                  className="rounded-full px-2 py-0.5 text-xs font-bold"
                  style={{ background: BUYER_COLORS.subtleFill, color: BUYER_COLORS.muted }}
                >
                  {count}
                </span>

                {/* Checkmark */}
                {isActive && (
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
                    <circle cx="9" cy="9" r="9" fill={BUYER_COLORS.accent} />
                    <path d="M5 9l3 3 5-5" stroke={BUYER_COLORS.accentText} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </>
  )
}
