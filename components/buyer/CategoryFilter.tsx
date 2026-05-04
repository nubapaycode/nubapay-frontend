'use client'

import { BUYER_COLORS } from '@/lib/buyerUi'
import { cn } from '@/lib/utils'

interface CategoryFilterProps {
  categories: string[]
  active: string
  onChange: (category: string) => void
}

export function CategoryFilter({ categories, active, onChange }: CategoryFilterProps) {
  const all = ['all', ...categories, 'combos']

  return (
    <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2">
      {all.map(category => (
        <button
          key={category}
          type="button"
          onClick={() => onChange(category)}
          className={cn(
            'flex-shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-colors md:px-5',
            active === category
              ? 'text-[#0A0F00]'
              : 'border bg-white text-[#0A0A0F]',
          )}
          style={
            active === category
              ? { background: BUYER_COLORS.accent, border: 'none' }
              : { borderColor: BUYER_COLORS.chipInactiveBorder, background: BUYER_COLORS.chipInactiveBg }
          }
        >
          {category === 'all' ? 'Todos' : category === 'combos' ? 'Combos' : category}
        </button>
      ))}
    </div>
  )
}
