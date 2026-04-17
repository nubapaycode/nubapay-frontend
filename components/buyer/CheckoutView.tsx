'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCart } from '@/lib/hooks/useCart'
import { Button } from '@/components/ui/Button'
import { formatPrice } from '@/lib/utils'

interface CheckoutViewProps {
  eventId: string
}

export function CheckoutView({ eventId }: CheckoutViewProps) {
  const router = useRouter()
  const { items, total, clearCart } = useCart()
  const [name, setName] = useState('')
  const [error, setError] = useState('')

  const handleConfirm = () => {
    if (name.trim() === '') {
      setError('Ingresá tu nombre para continuar')
      return
    }
    const orderId = crypto.randomUUID()
    clearCart()
    router.push(`/${eventId}/order/${orderId}`)
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Confirmá tu pedido</h1>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-4">
        <h2 className="font-semibold text-sm text-gray-500 mb-3">Resumen</h2>
        {items.length === 0 ? (
          <p className="text-sm text-gray-500">No tenés items en el carrito</p>
        ) : (
          <>
            {items.map(item => (
              <div
                key={item.productId}
                className="flex justify-between text-sm py-1.5 border-b border-gray-50 last:border-0"
              >
                <span className="text-gray-800">{item.name}</span>
                <span className="font-medium">
                  {formatPrice(item.price * item.quantity)}
                </span>
              </div>
            ))}
            <div className="flex justify-between mt-3 pt-3 border-t border-gray-200">
              <span className="font-medium">Total</span>
              <span className="font-bold text-lg">{formatPrice(total)}</span>
            </div>
          </>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Tu nombre
        </label>
        <input
          type="text"
          value={name}
          onChange={e => {
            setName(e.target.value)
            if (error) setError('')
          }}
          placeholder="Ej: Juan Pérez"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
        />
        {error && (
          <p className="text-red-500 text-xs mt-1.5">{error}</p>
        )}
      </div>

      <Button
        size="lg"
        className="w-full"
        disabled={items.length === 0}
        onClick={handleConfirm}
      >
        Confirmar pedido
      </Button>
    </div>
  )
}
