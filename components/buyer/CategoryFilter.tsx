'use client'

import { BUYER_COLORS } from '@/lib/buyerUi'

interface CategoryFilterProps {
  active: string
  onOpen: () => void
}

const LABELS: Record<string, string> = {
  all: 'Todos',
  descuentos: 'Descuentos',
  combos: 'Combos',
}

export function CategoryFilter({ active, onOpen }: CategoryFilterProps) {
  const label = LABELS[active] ?? active
  const isFiltered = active !== 'all'

  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors"
      style={
        isFiltered
          ? { background: BUYER_COLORS.accent, color: BUYER_COLORS.accentText, border: 'none' }
          : {
              background: BUYER_COLORS.chipInactiveBg,
              border: `1px solid ${BUYER_COLORS.chipInactiveBorder}`,
              color: BUYER_COLORS.text,
            }
      }
    >
      {/* Icono categorías */}
      <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden>
        <rect x="1" y="1" width="5.5" height="5.5" rx="1.5" fill="currentColor" />
        <rect x="8.5" y="1" width="5.5" height="5.5" rx="1.5" fill="currentColor" />
        <rect x="1" y="8.5" width="5.5" height="5.5" rx="1.5" fill="currentColor" />
        <rect x="8.5" y="8.5" width="5.5" height="5.5" rx="1.5" fill="currentColor" />
      </svg>
      {isFiltered ? label : 'Categorías'}
      {/* Chevron */}
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
        <path d="M2.5 4.5l3.5 3.5 3.5-3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  )
}
