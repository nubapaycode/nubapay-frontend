'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { catalogPaths } from '@/lib/api/paths'
import { buyerFlowPath } from '@/lib/buyerRoutes'
import { BUYER_COLORS, BUYER_FONT } from '@/lib/buyerUi'
import { useCart } from '@/lib/hooks/useCart'
import { cartItemsKey, loadPendingOrder, savePendingOrder } from '@/lib/pendingOrder'
import { formatPrice } from '@/lib/utils'
import type { Product } from '@/types'

import { CartItemRow } from './CartItemRow'

interface CartViewProps {
  eventId: string
  catalogSlug?: string
  products?: Product[]
}

export function CartView({ eventId, catalogSlug, products = [] }: CartViewProps) {
  const router = useRouter()
  const { items, addItem, updateQuantity, total } = useCart()
  const [goingToCheckout, setGoingToCheckout] = useState(false)
  const catalogPath = buyerFlowPath(eventId, { catalogSlug })
  const checkoutPath = buyerFlowPath(eventId, { catalogSlug, path: 'checkout' })

  // Encola la orden ya mismo (sin nombre/email: se adjuntan en el checkout vía
  // PATCH). Así el backend procesa Mercado Pago mientras el usuario tipea sus
  // datos. Si falla, el checkout cae al flujo clásico de crear al Pagar.
  const handleGoToCheckout = async () => {
    if (goingToCheckout) return
    setGoingToCheckout(true)
    const slug = catalogSlug ?? eventId
    const itemsKey = cartItemsKey(items)
    try {
      if (!loadPendingOrder(slug, itemsKey)) {
        const res = await fetch(catalogPaths.createOrder(slug), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Branded-Host': window.location.host,
          },
          body: JSON.stringify({
            customer_name: localStorage.getItem('nubapay_buyer_name') ?? '',
            customer_email: localStorage.getItem('nubapay_buyer_email') ?? '',
            payment_method: 'mp',
            items: items.map(it => ({ product_id: it.productId, quantity: it.quantity })),
            idempotency_key: crypto.randomUUID(),
          }),
        })
        if (res.ok) {
          const data = await res.json()
          savePendingOrder({ orderId: data.order_id, slug, itemsKey, createdAt: Date.now() })
        }
      }
    } catch {
      // sin orden pre-creada, el checkout la crea al confirmar
    } finally {
      router.push(checkoutPath)
    }
  }

  if (items.length === 0) {
    return (
      <div
        className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-6 text-center"
        style={{ fontFamily: BUYER_FONT }}
      >
        <div
          className="flex h-[72px] w-[72px] items-center justify-center rounded-[24px]"
          style={{ background: BUYER_COLORS.subtleFill }}
        >
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden>
            <path d="M4 4h3l4 16h14l3-10H8" stroke={BUYER_COLORS.iconMuted} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="13" cy="26" r="1.5" fill={BUYER_COLORS.iconMuted} />
            <circle cx="23" cy="26" r="1.5" fill={BUYER_COLORS.iconMuted} />
          </svg>
        </div>
        <div>
          <p className="mb-1 text-[17px] font-bold tracking-tight" style={{ color: BUYER_COLORS.text, letterSpacing: '-0.02em' }}>
            Tu carrito está vacío
          </p>
          <p className="text-[14px]" style={{ color: BUYER_COLORS.muted }}>
            Agregá productos para continuar
          </p>
        </div>
        <button
          type="button"
          onClick={() => router.push(catalogPath)}
          className="rounded-full px-5 py-2.5 text-[14px] font-semibold transition-opacity active:opacity-80"
          style={{ background: BUYER_COLORS.subtleFill, color: BUYER_COLORS.text }}
        >
          ← Volver al catálogo
        </button>
      </div>
    )
  }

  const itemCount = items.reduce((s, i) => s + i.quantity, 0)
  const listTotal = items.reduce((s, i) => s + (i.listPrice ?? i.price) * i.quantity, 0)
  const hasDiscount = listTotal > total

  const promoProducts = products.filter(p => p.available && p.promoLabel?.trim())
  const restProducts = products.filter(p => p.available && !p.promoLabel?.trim())
  const carouselProducts = [...promoProducts, ...restProducts]

  return (
    <div
      className="flex min-h-dvh flex-col"
      style={{ background: BUYER_COLORS.bg, fontFamily: BUYER_FONT }}
    >
      {/* Header */}
      <div
        className="sticky top-0 z-10 flex h-[60px] items-center px-4"
        style={{
          background: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderBottom: `1px solid ${BUYER_COLORS.border}`,
        } as React.CSSProperties}
      >
        <button
          type="button"
          onClick={() => router.push(catalogPath)}
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full transition-colors"
          style={{ background: BUYER_COLORS.subtleFill }}
          aria-label="Volver"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
            <path d="M11 4L6 9l5 5" stroke={BUYER_COLORS.text} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <span
          className="absolute left-1/2 -translate-x-1/2 text-[16px] font-bold tracking-tight"
          style={{ color: BUYER_COLORS.text, letterSpacing: '-0.02em' }}
        >
          Tu carrito
        </span>
      </div>

      {/* Contenido */}
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-3 px-4 py-4 pb-[180px]">

        {/* Lista de productos */}
        <div className="flex flex-col gap-3">
          {items.map(item => (
            <div
              key={item.productId}
              className="overflow-hidden rounded-[18px]"
              style={{ border: `1px solid ${BUYER_COLORS.border}` }}
            >
              <CartItemRow item={item} onUpdateQuantity={updateQuantity} />
            </div>
          ))}
        </div>

        {/* Carrusel de sugerencias */}
        {carouselProducts.length > 0 && (
          <>
          <div className="mt-2">
            <p className="mb-3 text-[18px] font-bold" style={{ color: '#000000' }}>
              Aprovechá y lleváte
            </p>
            <div className="-mx-4 overflow-x-auto px-4" style={{ scrollbarWidth: 'none' }}>
              <div className="flex gap-3 pb-1" style={{ width: 'max-content' }}>
                {carouselProducts.map(product => {
                  const remote = Boolean(product.imageUrl?.startsWith('http'))
                  return (
                    <div
                      key={product.id}
                      className="flex w-[160px] flex-shrink-0 flex-col overflow-hidden rounded-[14px] bg-white"
                      style={{ border: `1px solid ${BUYER_COLORS.border}` }}
                    >
                      <div
                        className="relative aspect-square w-full cursor-pointer overflow-hidden"
                        style={{ background: BUYER_COLORS.subtleFill }}
                        onClick={() => router.push(`/catalogo/${catalogSlug}/producto/${product.id}`)}
                      >
                        {product.promoLabel?.trim() && (
                          <div className="absolute left-1.5 top-1.5 z-[1]">
                            <span
                              className="inline-block rounded-full px-2 py-0.5 text-[10px] font-bold"
                              style={{ background: BUYER_COLORS.accent, color: BUYER_COLORS.accentText }}
                            >
                              {product.promoLabel}
                            </span>
                          </div>
                        )}
                        {product.imageUrl ? (
                          <Image
                            src={product.imageUrl}
                            alt={product.name}
                            fill
                            className="object-cover"
                            sizes="160px"
                            unoptimized={remote}
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden>
                              <path d="M5 10h18v10a2 2 0 01-2 2H7a2 2 0 01-2-2V10z" stroke={BUYER_COLORS.iconMuted} strokeWidth="1.25" strokeLinejoin="round" />
                              <path d="M5 13h18" stroke={BUYER_COLORS.iconMuted} strokeWidth="1.25" strokeLinecap="round" />
                            </svg>
                          </div>
                        )}
                        {/* Botón agregar sobre la imagen */}
                        <div className="absolute bottom-2 right-2 z-[1]" onClick={e => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => addItem(product)}
                            className="flex h-8 w-8 items-center justify-center rounded-full shadow-md transition-colors active:opacity-75"
                            style={{ background: BUYER_COLORS.accent, color: BUYER_COLORS.accentText }}
                            aria-label={`Agregar ${product.name}`}
                          >
                            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden>
                              <path d="M6.5 2v9M2 6.5h9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      <div
                        className="cursor-pointer px-2.5 pb-2.5 pt-2"
                        onClick={() => router.push(`/catalogo/${catalogSlug}/producto/${product.id}`)}
                      >
                        <p className="line-clamp-2 text-[12px] font-semibold leading-tight" style={{ color: BUYER_COLORS.text }}>
                          {product.name}
                        </p>
                        <p className="mt-0.5 text-[12px] font-bold" style={{ color: BUYER_COLORS.text }}>
                          {formatPrice(product.price)}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
          </>
        )}

        {/* Buscar más productos */}
        <button
          type="button"
          onClick={() => router.push(catalogPath)}
          className="flex h-[50px] w-full items-center justify-center rounded-full text-[15px] font-semibold transition-opacity active:opacity-75"
          style={{ background: BUYER_COLORS.subtleFill, color: BUYER_COLORS.text }}
        >
          Buscar más productos
        </button>

        {/* Divisor */}
        <div style={{ borderBottom: `1px solid ${BUYER_COLORS.border}` }} />

        {/* Resumen */}
        <div className="flex flex-col gap-3 pb-2">
          <p className="text-[18px] font-bold" style={{ color: '#000000' }}>Resumen</p>
          <div className="flex items-center justify-between">
            <span className="text-[15px] font-medium" style={{ color: '#000000' }}>Productos</span>
            <div className="flex items-center gap-2">
              {hasDiscount && (
                <span className="text-[14px] line-through" style={{ color: BUYER_COLORS.muted }}>
                  {formatPrice(listTotal)}
                </span>
              )}
              <span className="text-[15px] font-semibold" style={{ color: BUYER_COLORS.text }}>
                {formatPrice(total)}
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[15px] font-medium" style={{ color: '#000000' }}>Tarifa de servicio</span>
            <span className="text-[15px] font-semibold" style={{ color: '#22C55E' }}>Gratis</span>
          </div>
        </div>

      </div>

      {/* Bottom bar */}
      <div
        className="fixed bottom-0 left-0 right-0 z-20 border-t"
        style={{
          background: BUYER_COLORS.bg,
          borderColor: BUYER_COLORS.border,
        }}
      >
        <div className="mx-auto max-w-lg">

          {/* Subtotal + botón */}
          <div
            className="px-5 pb-4 pt-3"
            style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom, 16px))' }}
          >
            <div className="mb-3 grid grid-cols-2 items-baseline gap-y-1">
              {hasDiscount && (
                <>
                  <span className="text-[14px]" style={{ color: BUYER_COLORS.muted }}>Sin descuento</span>
                  <span
                    className="text-right text-[14px] font-medium line-through"
                    style={{ color: BUYER_COLORS.muted }}
                  >
                    {formatPrice(listTotal)}
                  </span>
                </>
              )}
              <span className="text-[22px] font-semibold" style={{ color: '#000000' }}>Subtotal</span>
              <span
                className="text-right text-[22px] font-semibold tracking-tight"
                style={{ color: BUYER_COLORS.text, letterSpacing: '-0.03em' }}
              >
                {formatPrice(total)}
              </span>
            </div>
            <button
              type="button"
              onClick={handleGoToCheckout}
              disabled={goingToCheckout}
              className="flex h-[54px] w-full items-center justify-center rounded-full text-[17px] font-semibold tracking-tight transition-opacity active:opacity-85 disabled:opacity-70"
              style={{ background: BUYER_COLORS.accent, color: BUYER_COLORS.accentText }}
            >
              Ir a pagar
            </button>
          </div>

        </div>
      </div>

    </div>
  )
}
