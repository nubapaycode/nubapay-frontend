'use client'

import { useEffect, useRef } from 'react'
import Image from 'next/image'
import type { Product, Combo } from '@/types'
import { BUYER_COLORS, BUYER_FONT } from '@/lib/buyerUi'
import { formatPrice } from '@/lib/utils'

type Item = Product | Combo

interface ProductDetailSheetProps {
  item: Item | null
  quantity: number
  onClose: () => void
  onAdd: (item: Item) => void
  onUpdateQuantity: (id: string, quantity: number) => void
}

function isCombo(item: Item): item is Combo {
  return 'products' in item
}

export function ProductDetailSheet({
  item,
  quantity,
  onClose,
  onAdd,
  onUpdateQuantity,
}: ProductDetailSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null)
  const open = item !== null

  // Bloquea scroll del body mientras está abierto
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [open])

  // Cierra con Escape
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!item) return null

  const remote = Boolean(item.imageUrl?.startsWith('http'))
  const hasDiscount = item.listPrice != null && item.listPrice > item.price
  const includedNames = isCombo(item) ? item.products.map(p => `${('quantity' in p ? (p as Product & { quantity?: number }).quantity ?? 1 : 1)}× ${p.name}`).join(' · ') : null

  const btnBase = 'flex items-center justify-center rounded-full transition-colors active:opacity-80'

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden
      />

      {/* Sheet — bottom drawer en mobile, modal centrado en md+ */}
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label={item.name}
        className="fixed inset-x-0 bottom-0 z-50 flex flex-col rounded-t-[28px] bg-white shadow-2xl md:inset-0 md:m-auto md:h-fit md:max-h-[90vh] md:max-w-2xl md:rounded-[24px]"
        style={{ fontFamily: BUYER_FONT, maxHeight: '92dvh' }}
      >
        {/* Handle pill — solo mobile */}
        <div className="flex justify-center pt-3 pb-1 md:hidden">
          <div className="h-1 w-10 rounded-full bg-black/10" />
        </div>

        {/* Botón cerrar — solo desktop */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-10 hidden h-9 w-9 items-center justify-center rounded-full bg-black/8 transition-colors hover:bg-black/12 md:flex"
          aria-label="Cerrar"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
            <path d="M3 3l10 10M13 3L3 13" stroke="#0A0A0F" strokeWidth="1.75" strokeLinecap="round" />
          </svg>
        </button>

        {/* Contenido scrollable */}
        <div className="flex flex-col overflow-y-auto md:flex-row">
          {/* Imagen */}
          <div
            className="relative w-full flex-shrink-0 overflow-hidden rounded-t-[28px] md:w-[44%] md:rounded-l-[24px] md:rounded-tr-none"
            style={{ aspectRatio: '4/3', background: BUYER_COLORS.subtleFill }}
          >
            {item.promoLabel?.trim() && (
              <div className="absolute left-3 top-3 z-[1]">
                <span
                  className="inline-block rounded-full px-3 py-1 text-[12px] font-extrabold tracking-tight shadow-sm"
                  style={{ background: BUYER_COLORS.accent, color: BUYER_COLORS.accentText }}
                >
                  {item.promoLabel}
                </span>
              </div>
            )}
            {item.imageUrl ? (
              <Image
                src={item.imageUrl}
                alt={item.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 44vw"
                unoptimized={remote}
                priority
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden>
                  <path d="M10 18h28v22a3 3 0 01-3 3H13a3 3 0 01-3-3V18z" stroke={BUYER_COLORS.iconMuted} strokeWidth="1.5" strokeLinejoin="round" />
                  <path d="M10 22h28" stroke={BUYER_COLORS.iconMuted} strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M18 32h5M27 32h9" stroke={BUYER_COLORS.iconMuted} strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex flex-1 flex-col gap-3 px-5 pb-4 pt-4 md:px-7 md:pb-7 md:pt-7">
            {/* Categoría */}
            {'category' in item && (
              <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: BUYER_COLORS.muted }}>
                {item.category}
              </span>
            )}

            {/* Nombre */}
            <h2 className="text-[22px] font-extrabold leading-tight tracking-tight" style={{ color: BUYER_COLORS.text, letterSpacing: '-0.03em' }}>
              {item.name}
            </h2>

            {/* Descripción */}
            {item.description?.trim() && (
              <p className="text-[15px] leading-relaxed" style={{ color: BUYER_COLORS.muted }}>
                {item.description}
              </p>
            )}

            {/* Contenido combo */}
            {includedNames && (
              <div className="rounded-[12px] px-4 py-3" style={{ background: BUYER_COLORS.subtleFill }}>
                <p className="mb-1 text-[11px] font-bold uppercase tracking-widest" style={{ color: BUYER_COLORS.muted }}>
                  Incluye
                </p>
                <p className="text-[13px] font-medium leading-snug" style={{ color: BUYER_COLORS.text }}>
                  {includedNames}
                </p>
              </div>
            )}

            {/* Precio */}
            <div className="flex items-baseline gap-2">
              {hasDiscount && (
                <span className="text-base font-semibold line-through" style={{ color: BUYER_COLORS.muted }}>
                  {formatPrice(item.listPrice!)}
                </span>
              )}
              <span className="text-[26px] font-extrabold tracking-tight" style={{ color: BUYER_COLORS.text, letterSpacing: '-0.03em' }}>
                {formatPrice(item.price)}
              </span>
              {hasDiscount && (
                <span className="rounded-full px-2 py-0.5 text-[11px] font-extrabold" style={{ background: BUYER_COLORS.accent, color: BUYER_COLORS.accentText }}>
                  {Math.round((1 - item.price / item.listPrice!) * 100)}% OFF
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Footer con acción — sticky al bottom */}
        <div
          className="flex items-center justify-between gap-3 border-t px-5 py-4 md:px-7"
          style={{
            borderColor: BUYER_COLORS.border,
            paddingBottom: 'max(16px, env(safe-area-inset-bottom, 16px))',
          }}
        >
          {quantity === 0 ? (
            <button
              type="button"
              onClick={() => onAdd(item)}
              className="flex h-[52px] w-full items-center justify-center gap-2 rounded-full text-[16px] font-extrabold tracking-tight transition-opacity active:opacity-85"
              style={{ background: BUYER_COLORS.accent, color: BUYER_COLORS.accentText }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
                <path d="M9 3v12M3 9h12" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" />
              </svg>
              Agregar al carrito
            </button>
          ) : (
            <>
              <div
                className="flex items-center gap-3 rounded-full px-3 py-2"
                style={{ background: BUYER_COLORS.subtleFill, border: `1px solid ${BUYER_COLORS.border}` }}
              >
                <button
                  type="button"
                  onClick={() => onUpdateQuantity(item.id, quantity - 1)}
                  className={`${btnBase} h-9 w-9 text-lg font-bold`}
                  style={{ background: BUYER_COLORS.surface, color: BUYER_COLORS.text }}
                  aria-label="Quitar uno"
                >
                  −
                </button>
                <span className="min-w-[24px] text-center text-[17px] font-extrabold" style={{ color: BUYER_COLORS.text }}>
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => onUpdateQuantity(item.id, quantity + 1)}
                  className={`${btnBase} h-9 w-9 text-lg font-bold`}
                  style={{ background: BUYER_COLORS.surface, color: BUYER_COLORS.text }}
                  aria-label="Agregar uno"
                >
                  +
                </button>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex h-[52px] flex-1 items-center justify-center rounded-full text-[15px] font-extrabold tracking-tight transition-opacity active:opacity-85"
                style={{ background: BUYER_COLORS.accent, color: BUYER_COLORS.accentText }}
              >
                Listo · {formatPrice(item.price * quantity)}
              </button>
            </>
          )}
        </div>
      </div>
    </>
  )
}
