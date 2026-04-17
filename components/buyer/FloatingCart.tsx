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
    <button
      onClick={() => router.push(`/${eventId}/cart`)}
      className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-gray-900 px-5 py-3 text-white shadow-lg hover:bg-gray-800 transition-colors"
    >
      <span className="text-sm font-medium">
        {count} {count === 1 ? 'item' : 'items'} · {formatPrice(total)}
      </span>
    </button>
  )
}
