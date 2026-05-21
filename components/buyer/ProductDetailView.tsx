'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import type { Product, Combo } from '@/types'
import { BUYER_COLORS, BUYER_FONT } from '@/lib/buyerUi'
import { formatPrice } from '@/lib/utils'
import { useCart } from '@/lib/hooks/useCart'

type Item = Product | Combo

interface ProductDetailViewProps {
  item: Item
  slug: string
}

function isCombo(item: Item): item is Combo {
  return 'products' in item
}

export function ProductDetailView({ item, slug }: ProductDetailViewProps) {
  const router = useRouter()
  const { items, addItem, updateQuantity } = useCart()

  const cartQty = items.find(i => i.productId === item.id)?.quantity ?? 0
  const [localQty, setLocalQty] = useState(1)

  // Sincroniza localQty con el carrito una vez que carga (localStorage es async)
  useEffect(() => {
    if (cartQty > 0) setLocalQty(cartQty)
  }, [cartQty])

  const handleConfirm = () => {
    // Functional updates se procesan en orden: addItem primero, luego updateQuantity
    // recibe el estado resultante del addItem como prev
    addItem(item as Product & Combo)
    updateQuantity(item.id, localQty)
    router.push(`/catalogo/${slug}`)
  }

  const remote = Boolean(item.imageUrl?.startsWith('http'))
  const hasDiscount = item.listPrice != null && item.listPrice > item.price
  const discount = hasDiscount ? Math.round((1 - item.price / item.listPrice!) * 100) : 0

  const comboLines = isCombo(item)
    ? item.products.map(p => ({
        name: p.name,
        qty: (p as Product & { quantity?: number }).quantity ?? 1,
      }))
    : null

  const btnBase = 'flex items-center justify-center rounded-full transition-colors active:opacity-80'

  return (
    <div
      className="min-h-dvh"
      style={{ background: BUYER_COLORS.bg, fontFamily: BUYER_FONT }}
    >
      {/* Contenido — layout responsivo */}
      <div className="mx-auto max-w-5xl md:flex md:min-h-dvh">

        {/* Imagen */}
        <div
          className="relative w-full overflow-hidden md:sticky md:top-0 md:h-dvh md:w-[50%] md:flex-shrink-0"
          style={{ aspectRatio: '1/1', background: BUYER_COLORS.subtleFill }}
        >
          {/* Botón volver — top left sobre la imagen */}
          <button
            type="button"
            onClick={() => router.back()}
            className="absolute left-4 top-9 z-[2] flex h-12 w-12 items-center justify-center rounded-full shadow-md transition-opacity active:opacity-80"
            style={{ background: 'rgba(255,255,255,0.92)', color: BUYER_COLORS.text }}
            aria-label="Volver"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
              <path d="M11 4L6 9l5 5" stroke={BUYER_COLORS.text} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {/* Tag de descuento — top right */}
          {item.promoLabel?.trim() && (
            <div className="absolute right-4 top-9 z-[2]">
              <span
                className="inline-block rounded-full px-5 py-2 text-[15px] font-semibold tracking-tight shadow-md"
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
              sizes="(max-width: 768px) 100vw, 50vw"
              unoptimized={remote}
              priority
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <svg width="64" height="64" viewBox="0 0 64 64" fill="none" aria-hidden>
                <path d="M14 24h36v30a4 4 0 01-4 4H18a4 4 0 01-4-4V24z" stroke={BUYER_COLORS.iconMuted} strokeWidth="1.5" strokeLinejoin="round" />
                <path d="M14 30h36" stroke={BUYER_COLORS.iconMuted} strokeWidth="1.5" strokeLinecap="round" />
                <path d="M24 44h8M36 44h12" stroke={BUYER_COLORS.iconMuted} strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
          )}
        </div>

        {/* Info + acción */}
        <div className="flex flex-1 flex-col px-5 pb-36 pt-6 md:px-8 md:pb-10 md:pt-10">

          {/* Nombre */}
          <h1
            className="text-[20px] font-semibold leading-[1.1]"
            style={{ color: BUYER_COLORS.text, letterSpacing: '-0.03em' }}
          >
            {item.name}
          </h1>

          {/* Descripción */}
          {item.description?.trim() && (
            <p
              className="mt-2 text-[15px] leading-relaxed"
              style={{ color: '#5A5A6A' }}
            >
              {item.description}
            </p>
          )}

          {/* Precio */}
          <div className="mt-5">
            <div className="flex items-baseline gap-3">
              <span
                className="text-[32px] font-semibold tracking-tight"
                style={{ color: BUYER_COLORS.text, letterSpacing: '-0.04em' }}
              >
                {formatPrice(item.price)}
              </span>
              {hasDiscount && (
                <span
                  className="text-[14px] font-medium line-through"
                  style={{ color: BUYER_COLORS.muted }}
                >
                  Antes {formatPrice(item.listPrice!)}
                </span>
              )}
            </div>
            {hasDiscount && (
              <div className="relative mt-4 inline-block">
                <span
                  className="inline-flex items-center rounded-[16px] px-4 py-2 text-[14px] font-semibold tracking-tight"
                  style={{ background: BUYER_COLORS.accent, color: BUYER_COLORS.accentText }}
                >
                  {discount}% OFF
                </span>
                {/* Cola del speech bubble */}
                <span
                  className="absolute -top-2 left-5 h-3 w-3 rotate-45"
                  style={{ background: BUYER_COLORS.accent }}
                  aria-hidden
                />
              </div>
            )}
          </div>

          {/* Contenido del combo */}
          {comboLines && (
            <div className="mt-6 rounded-[16px] p-4" style={{ background: BUYER_COLORS.subtleFill }}>
              <p
                className="mb-3 text-[11px] font-bold uppercase tracking-widest"
                style={{ color: BUYER_COLORS.muted }}
              >
                Incluye
              </p>
              <ul className="flex flex-col gap-2">
                {comboLines.map((line, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <span
                      className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold"
                      style={{ background: BUYER_COLORS.accent, color: BUYER_COLORS.accentText }}
                    >
                      {line.qty}
                    </span>
                    <span className="text-[14px] font-medium" style={{ color: BUYER_COLORS.text }}>
                      {line.name}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Footer fijo con acción */}
      <div
        className="fixed bottom-0 left-0 right-0 z-20 border-t px-5 py-4 md:left-[50%]"
        style={{
          background: BUYER_COLORS.bg,
          borderColor: BUYER_COLORS.border,
          paddingBottom: 'max(16px, env(safe-area-inset-bottom, 16px))',
        }}
      >
        <div className="mb-3 flex items-baseline justify-between">
          <span className="text-[20px] font-semibold tracking-tight" style={{ color: BUYER_COLORS.text, letterSpacing: '-0.03em' }}>
            {formatPrice(item.price * localQty)}
          </span>
          <span className="text-[20px] font-semibold" style={{ color: BUYER_COLORS.text }}>
            {localQty} {localQty === 1 ? 'producto' : 'productos'}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div
            className="flex items-center gap-2 rounded-full px-2.5 py-2"
            style={{ background: BUYER_COLORS.subtleFill, border: `1px solid ${BUYER_COLORS.border}` }}
          >
            <button
              type="button"
              onClick={() => setLocalQty(q => Math.max(1, q - 1))}
              className={`${btnBase} h-9 w-9`}
              style={{ background: BUYER_COLORS.surface, color: BUYER_COLORS.text }}
              aria-label="Quitar uno"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                <path d="M2 7h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
            <span
              className="min-w-[24px] text-center text-[17px] font-semibold"
              style={{ color: BUYER_COLORS.text }}
            >
              {localQty}
            </span>
            <button
              type="button"
              onClick={() => setLocalQty(q => q + 1)}
              className={`${btnBase} h-9 w-9`}
              style={{ background: BUYER_COLORS.surface, color: BUYER_COLORS.text }}
              aria-label="Agregar uno"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                <path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>
          <button
            type="button"
            onClick={handleConfirm}
            className="flex h-[54px] flex-1 items-center justify-center rounded-full text-[20px] font-semibold tracking-tight transition-opacity active:opacity-85"
            style={{ background: BUYER_COLORS.accent, color: BUYER_COLORS.accentText }}
          >
            Agregar
          </button>
        </div>
      </div>
    </div>
  )
}
