import Image from 'next/image'

import type { CatalogBlock, Combo, Product } from '@/types'
import { BUYER_COLORS } from '@/lib/buyerUi'
import { ComboCard } from './ComboCard'
import { ProductCard } from './ProductCard'

interface CatalogBlockSectionProps {
  block: CatalogBlock
  catalogSlug: string
  getQuantity: (id: string) => number
  onAdd: (item: Product | Combo) => void
  onUpdateQuantity: (productId: string, quantity: number) => void
}

/** Agrupa preservando el orden de aparición (ya viene ordenado por `sort_order` del bloque). */
function groupByCategory(products: Product[]): { category: string; items: Product[] }[] {
  const groups: { category: string; items: Product[] }[] = []
  const indexByCategory = new Map<string, number>()
  for (const product of products) {
    const key = product.category || 'Sin categoría'
    let idx = indexByCategory.get(key)
    if (idx === undefined) {
      idx = groups.length
      indexByCategory.set(key, idx)
      groups.push({ category: key, items: [] })
    }
    groups[idx].items.push(product)
  }
  return groups
}

export function CatalogBlockSection({ block, catalogSlug, getQuantity, onAdd, onUpdateQuantity }: CatalogBlockSectionProps) {
  const productGroups = groupByCategory(block.products)
  const hasCombos = block.combos.length > 0
  const showSubheadings = productGroups.length + (hasCombos ? 1 : 0) > 1

  return (
    <section className="mb-10">
      <h2
        className="mb-3 text-[15px] font-bold tracking-tight text-[#0A0A0F]"
        style={{ letterSpacing: '-0.02em' }}
      >
        {block.title}
      </h2>
      {block.bannerImageUrl && (
        <div className="relative mb-3 h-[120px] w-full overflow-hidden rounded-2xl sm:h-[160px]">
          <Image
            src={block.bannerImageUrl}
            alt={block.title}
            fill
            className="object-cover object-center"
            sizes="(max-width: 768px) 100vw, 800px"
            unoptimized={block.bannerImageUrl.startsWith('http')}
          />
        </div>
      )}

      {productGroups.map(group => (
        <div key={group.category} className="mb-5 last:mb-0">
          {showSubheadings && (
            <h3 className="mb-2 text-[13px] font-semibold" style={{ color: BUYER_COLORS.muted }}>
              {group.category}
            </h3>
          )}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {group.items.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                quantity={getQuantity(product.id)}
                catalogSlug={catalogSlug}
                onAdd={onAdd}
                onUpdateQuantity={onUpdateQuantity}
              />
            ))}
          </div>
        </div>
      ))}

      {hasCombos && (
        <div className="mb-5 last:mb-0">
          {showSubheadings && (
            <h3 className="mb-2 text-[13px] font-semibold" style={{ color: BUYER_COLORS.muted }}>
              Combos
            </h3>
          )}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {block.combos.map(combo => (
              <ComboCard
                key={combo.id}
                combo={combo}
                quantity={getQuantity(combo.id)}
                catalogSlug={catalogSlug}
                onAdd={onAdd}
                onUpdateQuantity={onUpdateQuantity}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
