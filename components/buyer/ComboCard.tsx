'use client'

import Image from 'next/image'
import type { Combo } from '@/types'
import { BUYER_COLORS } from '@/lib/buyerUi'
import { formatPrice } from '@/lib/utils'

interface ComboCardProps {
  combo: Combo
  quantity: number
  onAdd: (combo: Combo) => void
  onUpdateQuantity: (comboId: string, quantity: number) => void
}

function ComboPlaceholderIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden>
      <rect x="6" y="8" width="12" height="12" rx="2" stroke={BUYER_COLORS.iconMuted} strokeWidth="1.5" />
      <rect x="22" y="8" width="12" height="12" rx="2" stroke={BUYER_COLORS.iconMuted} strokeWidth="1.5" />
      <rect x="6" y="22" width="12" height="12" rx="2" stroke={BUYER_COLORS.iconMuted} strokeWidth="1.5" />
      <rect x="22" y="22" width="12" height="12" rx="2" stroke={BUYER_COLORS.iconMuted} strokeWidth="1.5" />
    </svg>
  )
}

export function ComboCard({ combo, quantity, onAdd, onUpdateQuantity }: ComboCardProps) {
  const includedNames = combo.products.map(p => p.name).join(', ')
  const remote = Boolean(combo.imageUrl && combo.imageUrl.startsWith('http'))

  const btnBase =
    'flex items-center justify-center rounded-full transition-colors active:opacity-90'

  return (
    <div
      className="flex flex-col overflow-hidden rounded-[18px] bg-white"
      style={{ border: `1px solid ${BUYER_COLORS.border}` }}
    >
      <div className="relative aspect-[8/7] overflow-hidden rounded-b-[18px]" style={{ background: BUYER_COLORS.subtleFill }}>
        {combo.promoLabel?.trim() ? (
          <div className="absolute left-2 top-2 z-[1] max-w-[calc(100%-1rem)]">
            <span
              className="inline-block truncate rounded-full px-2.5 py-1 text-[11px] font-extrabold tracking-tight shadow-sm"
              style={{ background: BUYER_COLORS.accent, color: BUYER_COLORS.accentText }}
            >
              {combo.promoLabel.trim()}
            </span>
          </div>
        ) : null}
        {combo.imageUrl ? (
          <Image
            src={combo.imageUrl}
            alt={combo.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 50vw, 25vw"
            unoptimized={remote}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <ComboPlaceholderIcon />
          </div>
        )}

        <div className="absolute bottom-2 right-2">
          {quantity === 0 ? (
            <button
              type="button"
              onClick={() => onAdd(combo)}
              className={`${btnBase} h-9 w-9 bg-white shadow-md`}
              style={{ border: `1px solid ${BUYER_COLORS.chipInactiveBorder}`, color: BUYER_COLORS.text }}
              aria-label={`Agregar combo ${combo.name}`}
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
                onClick={() => onUpdateQuantity(combo.id, quantity - 1)}
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
                onClick={() => onUpdateQuantity(combo.id, quantity + 1)}
                className={`${btnBase} h-7 w-7 text-sm font-bold`}
                style={{ background: BUYER_COLORS.subtleFill, color: BUYER_COLORS.text }}
                aria-label="Agregar uno"
              >
                +
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="border-t p-3" style={{ borderColor: BUYER_COLORS.border }}>
        <h3 className="line-clamp-1 text-sm font-bold leading-tight" style={{ color: BUYER_COLORS.text }}>
          {combo.name}
        </h3>
        <p className="mt-0.5 line-clamp-2 text-xs leading-snug" style={{ color: BUYER_COLORS.muted }}>
          Incluye: {includedNames}
        </p>
        <div className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          {combo.listPrice != null && combo.listPrice > combo.price ? (
            <span className="text-xs font-semibold line-through" style={{ color: BUYER_COLORS.muted }}>
              {formatPrice(combo.listPrice)}
            </span>
          ) : null}
          <span className="text-sm font-extrabold tracking-tight" style={{ color: BUYER_COLORS.text }}>
            {formatPrice(combo.price)}
          </span>
        </div>
      </div>
    </div>
  )
}
