'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCart } from '@/lib/hooks/useCart'
import { Button } from '@/components/ui/Button'
import { formatPrice } from '@/lib/utils'
import { saveOrder } from '@/lib/hooks/useOrderStore'
import { buyerFlowPath } from '@/lib/buyerRoutes'

interface CheckoutViewProps {
  eventId: string
  catalogSlug?: string
}

const paymentMethods = [
  { id: 'mp', label: 'Mercado Pago', icon: '💳' },
  { id: 'cash', label: 'Efectivo', icon: '💵' },
  { id: 'transfer', label: 'Transferencia', icon: '🏦' },
]

export function CheckoutView({ eventId, catalogSlug }: CheckoutViewProps) {
  const router = useRouter()
  const { items, total, clearCart } = useCart()
  const [name, setName] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('')
  const [error, setError] = useState('')

  const handleConfirm = () => {
    if (name.trim() === '') {
      setError('Ingresá tu nombre para continuar')
      return
    }
    if (!paymentMethod) {
      setError('Seleccioná un método de pago')
      return
    }
    const orderId = crypto.randomUUID()
    saveOrder({ orderId, items, total, paymentMethod, createdAt: new Date().toISOString() })
    clearCart()
    router.push(buyerFlowPath(eventId, { catalogSlug, path: `order/${orderId}` }))
  }

  const toCart = () => router.push(buyerFlowPath(eventId, { catalogSlug, path: 'cart' }))

  return (
    <div className="flex flex-col min-h-screen">
      {/* Top bar */}
      <div className="sticky top-0 z-10 bg-white flex items-center px-4 h-[76px] shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
        <button
          onClick={toCart}
          className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors shrink-0"
        >
          ←
        </button>
        <h1 className="text-[20px] font-semibold absolute left-1/2 -translate-x-1/2">Checkout</h1>
      </div>

      <div className="flex flex-col flex-1 p-4 gap-4">
        {/* Resumen */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Resumen del pedido</h2>
          {items.length === 0 ? (
            <p className="text-sm text-gray-500">No tenés items en el carrito</p>
          ) : (
            <>
              {items.map(item => (
                <div
                  key={item.productId}
                  className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-xs font-semibold text-gray-500 shrink-0">
                      {item.quantity}
                    </span>
                    <span className="text-sm text-gray-800">{item.name}</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">{formatPrice(item.price * item.quantity)}</span>
                </div>
              ))}
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                <span className="text-sm text-gray-500">Servicio</span>
                <span className="text-sm font-medium text-green-600">Gratis</span>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="font-semibold text-gray-900">Total</span>
                <span className="text-xl font-bold text-gray-900">{formatPrice(total)}</span>
              </div>
            </>
          )}
        </div>

        {/* Nombre */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
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
        </div>

        {/* Método de pago */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <h2 className="font-semibold text-sm text-gray-500 mb-3">Método de pago</h2>
          <div className="flex flex-col gap-2">
            {paymentMethods.map(method => (
              <button
                key={method.id}
                onClick={() => {
                  setPaymentMethod(method.id)
                  if (error) setError('')
                }}
                className={`flex items-center gap-3 w-full rounded-xl border px-4 py-3 text-sm font-medium transition-colors ${
                  paymentMethod === method.id
                    ? 'border-gray-900 bg-gray-900 text-white'
                    : 'border-gray-200 text-gray-800 hover:bg-gray-50'
                }`}
              >
                <span className="text-lg">{method.icon}</span>
                {method.label}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <p className="text-red-500 text-xs -mt-2">{error}</p>
        )}

        {/* CTA */}
        <div className="mt-auto pt-2">
          <Button
            size="lg"
            className="w-full rounded-full"
            disabled={items.length === 0}
            onClick={handleConfirm}
          >
            Pagar {items.length > 0 ? formatPrice(total) : ''}
          </Button>
        </div>
      </div>
    </div>
  )
}
