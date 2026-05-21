'use client'

import Image from 'next/image'
import type { CartItem } from '@/types'
import { BUYER_COLORS } from '@/lib/buyerUi'
import { formatPrice } from '@/lib/utils'

interface CartItemRowProps {
  item: CartItem
  onUpdateQuantity: (productId: string, quantity: number) => void
}

export function CartItemRow({ item, onUpdateQuantity }: CartItemRowProps) {
  const remote = Boolean(item.imageUrl?.startsWith('http'))
  const btnBase = 'flex items-center justify-center rounded-full transition-colors active:opacity-75'

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 last:border-0"
      style={{ borderBottom: `1px solid ${BUYER_COLORS.border}` }}
    >
      {/* Imagen */}
      <div
        className="relative h-[68px] w-[68px] flex-shrink-0 overflow-hidden rounded-[14px]"
        style={{ background: BUYER_COLORS.subtleFill }}
      >
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={item.name}
            fill
            className="object-cover"
            sizes="68px"
            unoptimized={remote}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M6 10h12v10a2 2 0 01-2 2H8a2 2 0 01-2-2V10z" stroke={BUYER_COLORS.iconMuted} strokeWidth="1.25" strokeLinejoin="round" />
              <path d="M6 12h12" stroke={BUYER_COLORS.iconMuted} strokeWidth="1.25" strokeLinecap="round" />
            </svg>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p
          className="truncate text-[15px] font-semibold leading-tight"
          style={{ color: BUYER_COLORS.text }}
        >
          {item.name}
        </p>
        <p className="text-[13px]" style={{ color: BUYER_COLORS.muted }}>
          {formatPrice(item.price)} c/u
        </p>
        <p className="text-[15px] font-semibold" style={{ color: BUYER_COLORS.text }}>
          {formatPrice(item.price * item.quantity)}
        </p>
      </div>

      {/* Stepper */}
      <div
        className="flex flex-shrink-0 items-center gap-1.5 rounded-full px-1.5 py-1"
        style={{ background: BUYER_COLORS.subtleFill, border: `1px solid ${BUYER_COLORS.border}` }}
      >
        <button
          type="button"
          onClick={() => onUpdateQuantity(item.productId, item.quantity - 1)}
          className={`${btnBase} h-7 w-7`}
          style={{ background: BUYER_COLORS.surface, color: BUYER_COLORS.text }}
          aria-label={item.quantity === 1 ? 'Eliminar' : 'Quitar uno'}
        >
          {item.quantity === 1 ? (
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden>
              <path d="M2 3.5h9M5 3.5V2.5a.5.5 0 01.5-.5h2a.5.5 0 01.5.5v1M10.5 3.5l-.5 7a1 1 0 01-1 .9H4a1 1 0 01-1-.9l-.5-7" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
              <path d="M2 6h8" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
            </svg>
          )}
        </button>
        <span
          className="min-w-[20px] text-center text-[15px] font-semibold"
          style={{ color: BUYER_COLORS.text }}
        >
          {item.quantity}
        </span>
        <button
          type="button"
          onClick={() => onUpdateQuantity(item.productId, item.quantity + 1)}
          className={`${btnBase} h-7 w-7`}
          style={{ background: BUYER_COLORS.surface, color: BUYER_COLORS.text }}
          aria-label="Agregar uno"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
            <path d="M6 2v8M2 6h8" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </div>
  )
}
