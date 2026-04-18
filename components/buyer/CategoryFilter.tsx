'use client'

import { cn } from '@/lib/utils'

interface CategoryFilterProps {
  categories: string[]
  active: string
  onChange: (category: string) => void
}

export function CategoryFilter({ categories, active, onChange }: CategoryFilterProps) {
  const all = ['all', ...categories, 'combos']

  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {all.map(category => (
        <button
          key={category}
          onClick={() => onChange(category)}
          className={cn(
            'flex-shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
            active === category
              ? 'bg-gray-900 text-white'
              : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
          )}
        >
          {category === 'all' ? 'Todos' : category === 'combos' ? 'Combos' : category}
        </button>
      ))}
    </div>
  )
}
