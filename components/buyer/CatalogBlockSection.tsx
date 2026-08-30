import Image from 'next/image'

import type { CatalogBlock, Combo, Product } from '@/types'
import { ComboCard } from './ComboCard'
import { ProductCard } from './ProductCard'

interface CatalogBlockSectionProps {
  block: CatalogBlock
  catalogSlug: string
  getQuantity: (id: string) => number
  onAdd: (item: Product | Combo) => void
  onUpdateQuantity: (productId: string, quantity: number) => void
  cartDisabled?: boolean
}

export function CatalogBlockSection({ block, catalogSlug, getQuantity, onAdd, onUpdateQuantity, cartDisabled = false }: CatalogBlockSectionProps) {
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
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {block.products.map(product => (
          <ProductCard
            key={product.id}
            product={product}
            quantity={getQuantity(product.id)}
            catalogSlug={catalogSlug}
            onAdd={onAdd}
            onUpdateQuantity={onUpdateQuantity}
            cartDisabled={cartDisabled}
          />
        ))}
        {block.combos.map(combo => (
          <ComboCard
            key={combo.id}
            combo={combo}
            quantity={getQuantity(combo.id)}
            catalogSlug={catalogSlug}
            onAdd={onAdd}
            onUpdateQuantity={onUpdateQuantity}
            cartDisabled={cartDisabled}
          />
        ))}
      </div>
    </section>
  )
}
