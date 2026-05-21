'use client'

import { useRouter } from 'next/navigation'

import { buyerFlowPath } from '@/lib/buyerRoutes'
import { BUYER_COLORS, BUYER_FONT } from '@/lib/buyerUi'
import { formatPrice } from '@/lib/utils'

interface FloatingCartProps {
  count: number
  total: number
  eventId: string
  /** Si el usuario entró por `/catalogo/:slug`, el carrito sigue bajo esa ruta (sin UUID en la URL). */
  catalogSlug?: string
}

export function FloatingCart({ count, total, eventId, catalogSlug }: FloatingCartProps) {
  const router = useRouter()

  const goCart = () => {
    router.push(buyerFlowPath(eventId, { catalogSlug, path: 'cart' }))
  }

  if (count === 0) return null

  const label =
    `${count} ${count === 1 ? 'producto' : 'productos'} · ${formatPrice(total)}`

  const btnStyle = {
    fontFamily: BUYER_FONT,
    background: BUYER_COLORS.accent,
    color: BUYER_COLORS.accentText,
  } as const

  return (
    <>
      {/* Mobile: bottom bar */}
      <div
        className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-between border-t px-5 py-5 shadow-[0_-4px_24px_rgba(0,0,0,0.08)] md:hidden"
        style={{
          background: BUYER_COLORS.surface,
          borderColor: BUYER_COLORS.border,
          paddingBottom: 'max(16px, env(safe-area-inset-bottom, 16px))',
        }}
      >
        <div style={{ fontFamily: BUYER_FONT }}>
          <p className="text-[18px] font-semibold" style={{ color: BUYER_COLORS.text }}>
            {formatPrice(total)}
          </p>
          <p className="text-[18px] font-semibold tracking-tight" style={{ color: BUYER_COLORS.text }}>
            {count} {count === 1 ? 'producto' : 'productos'}
          </p>
        </div>
        <button
          type="button"
          onClick={goCart}
          className="rounded-full px-14 py-3.5 text-[18px] font-semibold tracking-tight transition-opacity active:opacity-90"
          style={btnStyle}
        >
          Ver carrito
        </button>
      </div>

      {/* Desktop: floating pill */}
      <button
        type="button"
        onClick={goCart}
        className="fixed bottom-6 right-6 z-40 hidden items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold shadow-lg transition-opacity hover:opacity-95 md:flex"
        style={btnStyle}
      >
        <span>{label}</span>
      </button>
    </>
  )
}
