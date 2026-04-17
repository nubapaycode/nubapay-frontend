'use client'

import { useRouter } from 'next/navigation'
import { useCart } from '@/lib/hooks/useCart'
import { CartItemRow } from './CartItemRow'
import { Button } from '@/components/ui/Button'
import { formatPrice } from '@/lib/utils'

interface CartViewProps {
  eventId: string
}

export function CartView({ eventId }: CartViewProps) {
  const router = useRouter()
  const { items, updateQuantity, total } = useCart()

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
        <span className="text-6xl">🛒</span>
        <p className="text-lg font-medium text-gray-700">Tu carrito está vacío</p>
        <Button variant="secondary" onClick={() => router.push(`/${eventId}`)}>
          ← Volver al catálogo
        </Button>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Tu pedido</h1>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-4">
        {items.map(item => (
          <CartItemRow
            key={item.productId}
            item={item}
            onUpdateQuantity={updateQuantity}
          />
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-6">
        <div className="flex items-center justify-between">
          <span className="font-medium text-gray-700">Total</span>
          <span className="text-xl font-bold">{formatPrice(total)}</span>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <Button size="lg" onClick={() => router.push(`/${eventId}/checkout`)}>
          Ir al checkout →
        </Button>
        <Button variant="ghost" onClick={() => router.push(`/${eventId}`)}>
          ← Seguir comprando
        </Button>
      </div>
    </div>
  )
}
