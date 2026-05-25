'use client'

import { useRouter } from 'next/navigation'
import Image from 'next/image'
import type { Product } from '@/types'
import { BUYER_COLORS } from '@/lib/buyerUi'
import { formatPrice } from '@/lib/utils'

interface ProductCardProps {
  product: Product
  quantity: number
  catalogSlug?: string
  onAdd: (product: Product) => void
  onUpdateQuantity: (productId: string, quantity: number) => void
}

function PlaceholderIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden>
      <path
        d="M8 14h24v18a2 2 0 01-2 2H10a2 2 0 01-2-2V14z"
        stroke={BUYER_COLORS.iconMuted}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M8 18h24" stroke={BUYER_COLORS.iconMuted} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M14 26h4M22 26h8" stroke={BUYER_COLORS.iconMuted} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

export function ProductCard({ product, quantity, catalogSlug = '', onAdd, onUpdateQuantity }: ProductCardProps) {
  const router = useRouter()
  const remote = Boolean(product.imageUrl && product.imageUrl.startsWith('http'))
  const available = product.available !== false
  const btnBase = 'flex items-center justify-center rounded-full transition-colors active:opacity-90'

  return (
    <div
      className={`flex flex-col overflow-hidden rounded-[18px] bg-white ${available ? 'cursor-pointer' : 'cursor-default'}`}
      style={{ border: `1px solid ${BUYER_COLORS.border}`, opacity: available ? 1 : 0.75 }}
      onClick={() => available && catalogSlug && router.push(`/catalogo/${catalogSlug}/producto/${product.id}`)}
    >
      <div className="relative aspect-[8/7] overflow-hidden rounded-b-[18px]" style={{ background: BUYER_COLORS.subtleFill }}>
        {product.promoLabel?.trim() && available ? (
          <div className="absolute left-2 top-2 z-[1] max-w-[calc(100%-1rem)]">
            <span
              className="inline-block truncate rounded-full px-2.5 py-1 text-[11px] font-extrabold tracking-tight shadow-sm"
              style={{ background: BUYER_COLORS.accent, color: BUYER_COLORS.accentText }}
            >
              {product.promoLabel.trim()}
            </span>
          </div>
        ) : null}

        {!available && (
          <div className="absolute left-2 top-2 z-[2]">
            <span className="inline-block rounded-full bg-black/70 px-2.5 py-1 text-[11px] font-bold text-white">
              Agotado
            </span>
          </div>
        )}

        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            className={`object-cover ${!available ? 'grayscale' : ''}`}
            sizes="(max-width: 768px) 50vw, 25vw"
            unoptimized={remote}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <PlaceholderIcon />
          </div>
        )}

        {!available && (
          <div className="absolute inset-0 bg-white/40" />
        )}

        {available && (
          <div className="absolute bottom-2 right-2" onClick={e => e.stopPropagation()}>
            {quantity === 0 ? (
              <button
                type="button"
                onClick={() => onAdd(product)}
                className={`${btnBase} h-9 w-9 bg-white shadow-md`}
                style={{ border: `1px solid ${BUYER_COLORS.chipInactiveBorder}`, color: BUYER_COLORS.text }}
                aria-label={`Agregar ${product.name}`}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                  <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            ) : (
              <div
                className="flex items-center gap-2 rounded-full px-2 py-1.5 shadow-md"
                style={{ background: BUYER_COLORS.surface, border: `1px solid ${BUYER_COLORS.border}` }}
              >
                <button
                  type="button"
                  onClick={() => onUpdateQuantity(product.id, quantity - 1)}
                  className={`${btnBase} h-7 w-7 text-sm font-bold`}
                  style={{ background: BUYER_COLORS.subtleFill, color: BUYER_COLORS.text }}
                  aria-label="Quitar uno"
                >
                  −
                </button>
                <span className="min-w-[18px] text-center text-sm font-extrabold" style={{ color: BUYER_COLORS.text }}>
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => onUpdateQuantity(product.id, quantity + 1)}
                  className={`${btnBase} h-7 w-7 text-sm font-bold`}
                  style={{ background: BUYER_COLORS.subtleFill, color: BUYER_COLORS.text }}
                  aria-label="Agregar uno"
                >
                  +
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="p-3">
        <h3
          className="line-clamp-1 text-sm font-bold leading-tight"
          style={{ color: available ? BUYER_COLORS.text : BUYER_COLORS.muted }}
        >
          {product.name}
        </h3>
        {product.description?.trim() ? (
          <p className="mt-0.5 line-clamp-2 text-xs leading-snug" style={{ color: BUYER_COLORS.muted }}>
            {product.description}
          </p>
        ) : null}
        <div className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          {product.listPrice != null && product.listPrice > product.price ? (
            <span className="text-xs font-semibold line-through" style={{ color: BUYER_COLORS.muted }}>
              {formatPrice(product.listPrice)}
            </span>
          ) : null}
          <span
            className="text-sm font-extrabold tracking-tight"
            style={{ color: available ? BUYER_COLORS.text : BUYER_COLORS.muted }}
          >
            {formatPrice(product.price)}
          </span>
        </div>
      </div>
    </div>
  )
}
