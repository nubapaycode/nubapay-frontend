'use client'

import { useRouter } from 'next/navigation'
import { formatPrice } from '@/lib/utils'

interface FloatingCartProps {
  count: number
  total: number
  eventId: string
}

export function FloatingCart({ count, total, eventId }: FloatingCartProps) {
  const router = useRouter()

  if (count === 0) return null

  return (
    <>
      {/* Mobile: bottom bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100 px-4 py-5 flex items-center justify-between shadow-[0_-4px_16px_rgba(0,0,0,0.06)]">
        <div>
          <p className="text-base font-semibold text-gray-900">
            {count} {count === 1 ? 'producto' : 'productos'}
          </p>
          <p className="text-base font-semibold text-gray-900">{formatPrice(total)}</p>
        </div>
        <button
          onClick={() => router.push(`/${eventId}/cart`)}
          className="rounded-full bg-gray-900 px-6 py-3 text-base font-semibold text-white hover:bg-gray-800 transition-colors"
        >
          Ver carrito
        </button>
      </div>

      {/* Desktop: floating pill */}
      <button
        onClick={() => router.push(`/${eventId}/cart`)}
        className="hidden md:flex fixed bottom-6 right-6 z-40 items-center gap-2 rounded-full bg-gray-900 px-5 py-3 text-white shadow-lg hover:bg-gray-800 transition-colors"
      >
        <span className="text-sm font-medium">
          {count} {count === 1 ? 'item' : 'items'} · {formatPrice(total)}
        </span>
      </button>
    </>
  )
}
