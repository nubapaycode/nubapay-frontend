'use client'

import { BUYER_COLORS, BUYER_FONT } from '@/lib/buyerUi'

interface CategoryShortcutsProps {
  categories: string[]
  onSelect: (category: string) => void
  onViewAll: () => void
}

export function CategoryShortcuts({ categories, onSelect, onViewAll }: CategoryShortcutsProps) {
  return (
    <div className="mx-auto max-w-2xl px-4 pb-10 pt-6 md:px-6" style={{ fontFamily: BUYER_FONT }}>
      <p
        className="mb-4 text-center text-[15px] font-semibold"
        style={{ color: BUYER_COLORS.text }}
      >
        ¿Qué estás buscando?
      </p>

      <div className="flex flex-col gap-3">
        {categories.map(category => (
          <button
            key={category}
            type="button"
            onClick={() => onSelect(category)}
            className="flex w-full items-center justify-between gap-3 rounded-2xl px-5 py-4 text-left transition-opacity active:opacity-70"
            style={{ background: BUYER_COLORS.subtleFill }}
          >
            <span className="text-[15px] font-semibold" style={{ color: BUYER_COLORS.text }}>
              {category}
            </span>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
              <path
                d="M6 3.5L11 8l-5 4.5"
                stroke={BUYER_COLORS.iconMuted}
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={onViewAll}
        className="mt-5 w-full text-center text-sm font-semibold underline underline-offset-2"
        style={{ color: BUYER_COLORS.muted }}
      >
        Ver todos los productos →
      </button>
    </div>
  )
}
