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
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4 text-center">
        <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center text-4xl">
          🛒
        </div>
        <div>
          <p className="text-lg font-semibold text-gray-800">Tu carrito está vacío</p>
          <p className="text-sm text-gray-400 mt-1">Agregá productos para continuar</p>
        </div>
        <Button variant="secondary" onClick={() => router.push(`/${eventId}`)}>
          ← Volver al catálogo
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Top bar */}
      <div className="sticky top-0 z-10 bg-white flex items-center px-4 h-[76px] shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
        <button
          onClick={() => router.push(`/${eventId}`)}
          className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors shrink-0"
        >
          ←
        </button>
        <h1 className="text-[20px] font-semibold absolute left-1/2 -translate-x-1/2">Tu carrito</h1>
      </div>

      <div className="flex flex-col flex-1 p-4">

      {/* Items */}
      <div className="bg-white rounded-2xl border border-gray-100  px-4 mb-4">
        {items.map(item => (
          <CartItemRow
            key={item.productId}
            item={item}
            onUpdateQuantity={updateQuantity}
          />
        ))}
      </div>

      {/* Resumen */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-6">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Resumen</h2>
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-gray-500">Subtotal</span>
          <span className="font-medium text-gray-900">{formatPrice(total)}</span>
        </div>
        <div className="flex items-center justify-between text-sm pb-3 border-b border-gray-100">
          <span className="text-gray-500">Servicio</span>
          <span className="font-medium text-green-600">Gratis</span>
        </div>
        <div className="flex items-center justify-between mt-3">
          <span className="font-semibold text-gray-900">Total</span>
          <span className="text-xl font-bold text-gray-900">{formatPrice(total)}</span>
        </div>
      </div>

      {/* CTA */}
      <div className="mt-auto">
        <Button size="lg" className="w-full rounded-full" onClick={() => router.push(`/${eventId}/checkout`)}>
          Ir a pagar
        </Button>
      </div>
      </div>
    </div>
  )
}
