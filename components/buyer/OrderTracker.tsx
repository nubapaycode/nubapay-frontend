'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useOrderStatus } from '@/lib/hooks/useOrderStatus'
import { getOrder } from '@/lib/hooks/useOrderStore'
import { formatPrice } from '@/lib/utils'
import { buyerFlowPath } from '@/lib/buyerRoutes'
import type { OrderStatus, CartItem } from '@/types'

interface OrderTrackerProps {
  orderId: string
  eventId: string
  catalogSlug?: string
}

const steps: { key: OrderStatus; label: string; description: string }[] = [
  { key: 'pending', label: 'Recibido', description: 'Tu pedido fue registrado' },
  { key: 'preparing', label: 'En preparación', description: 'Estamos preparando tu pedido' },
  { key: 'ready', label: 'Listo para retirar', description: 'Acercate al mostrador' },
  { key: 'delivered', label: 'Entregado', description: '¡Que lo disfrutes!' },
]

const statusOrder: OrderStatus[] = ['pending', 'preparing', 'ready', 'delivered']

const paymentLabels: Record<string, string> = {
  mp: 'Mercado Pago',
  cash: 'Efectivo',
  transfer: 'Transferencia',
}

function getStepState(stepKey: OrderStatus, currentStatus: OrderStatus): 'completed' | 'active' | 'pending' {
  const stepIdx = statusOrder.indexOf(stepKey)
  const currentIdx = statusOrder.indexOf(currentStatus)
  if (stepIdx < currentIdx) return 'completed'
  if (stepIdx === currentIdx) return 'active'
  return 'pending'
}

export function OrderTracker({ orderId, eventId, catalogSlug }: OrderTrackerProps) {
  const router = useRouter()
  const { status } = useOrderStatus(orderId)
  const [items, setItems] = useState<CartItem[]>([])
  const [total, setTotal] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState('')
  const [createdAt, setCreatedAt] = useState('')

  useEffect(() => {
    const order = getOrder(orderId)
    if (order) {
      setItems(order.items)
      setTotal(order.total)
      setPaymentMethod(order.paymentMethod)
      setCreatedAt(order.createdAt)
    } else {
      setItems([
        { productId: 'p4', name: 'Gaseosa 500ml', price: 1200, quantity: 2 },
        { productId: 'c1', name: 'Combo Clásico', price: 4200, quantity: 1 },
      ])
      setTotal(6600)
      setPaymentMethod('mp')
      setCreatedAt(new Date().toISOString())
    }
  }, [orderId])

  const formattedDate = createdAt
    ? new Date(createdAt).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : ''

  return (
    <div className="flex flex-col min-h-screen">
      {/* Top bar */}
      <div className="sticky top-0 z-10 bg-white flex items-center px-4 h-[76px] shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
        <h1 className="text-[20px] font-semibold absolute left-1/2 -translate-x-1/2">Detalle del pedido</h1>
      </div>

      <div className="flex flex-col flex-1 p-4 gap-4">

        {/* Estado */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Estado</h2>
          <div className="flex flex-col">
            {steps.map((step, i) => {
              const state = getStepState(step.key, status)
              return (
                <div key={step.key} className="flex items-start gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                      state === 'completed' ? 'bg-gray-900 text-white'
                      : state === 'active' ? 'bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-300'
                    }`}>
                      {state === 'completed' ? '✓' : i + 1}
                    </div>
                    {i < steps.length - 1 && (
                      <div className={`w-px mt-1 mb-1 h-6 ${state === 'completed' ? 'bg-gray-900' : 'bg-gray-100'}`} />
                    )}
                  </div>
                  <div className="pb-1">
                    <p className={`text-sm font-semibold ${state === 'pending' ? 'text-gray-300' : 'text-gray-900'}`}>
                      {step.label}
                    </p>
                    {state === 'active' && (
                      <p className="text-xs text-gray-400 mt-0.5">{step.description}</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Items */}
        {items.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Productos</h2>
            {items.map(item => (
              <div key={item.productId} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
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
              <span className="font-semibold text-gray-900">Total</span>
              <span className="text-lg font-bold text-gray-900">{formatPrice(total)}</span>
            </div>
          </div>
        )}

        {/* Info */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Información</h2>
          <div className="flex flex-col gap-2.5">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Número de pedido</span>
              <span className="font-mono font-semibold text-gray-900">#{orderId.slice(0, 8).toUpperCase()}</span>
            </div>
            {formattedDate && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Fecha</span>
                <span className="font-medium text-gray-900">{formattedDate}</span>
              </div>
            )}
            {paymentMethod && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Método de pago</span>
                <span className="font-medium text-gray-900">{paymentLabels[paymentMethod] ?? paymentMethod}</span>
              </div>
            )}
          </div>
        </div>

        {/* CTA */}
        {status === 'ready' && (
          <div className="mt-auto">
            <button
              onClick={() =>
                router.push(buyerFlowPath(eventId, { catalogSlug, path: `qr/${orderId}` }))
              }
              className="w-full rounded-full bg-gray-900 text-white text-sm font-semibold py-4 hover:bg-gray-700 transition-colors"
            >
              Ver QR de retiro
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
