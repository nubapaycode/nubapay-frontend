'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { formatPrice } from '@/lib/utils'
import { buyerFlowPath } from '@/lib/buyerRoutes'
import { catalogPaths } from '@/lib/api/paths'
import type { OrderStatus } from '@/types'

interface OrderTrackerProps {
  orderId: string
  eventId: string
  catalogSlug?: string
}

interface OrderData {
  order_id: string
  order_number: number | null
  status: string
  payment_status: string
  total_amount: number
  customer_name: string | null
  payment_method: string | null
  checkout_url: string | null
  items: { product_id: string | null; product_name: string; unit_price: number; quantity: number; subtotal: number }[]
  created_at: string
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

function normalizeStatus(raw: string): OrderStatus {
  if (statusOrder.includes(raw as OrderStatus)) return raw as OrderStatus
  // pending_payment se muestra como "pending" (esperando confirmación)
  return 'pending'
}

function getStepState(
  stepKey: OrderStatus,
  currentStatus: OrderStatus,
): 'completed' | 'active' | 'pending' {
  const stepIdx = statusOrder.indexOf(stepKey)
  const currentIdx = statusOrder.indexOf(currentStatus)
  if (stepIdx < currentIdx) return 'completed'
  if (stepIdx === currentIdx) return 'active'
  return 'pending'
}

const POLL_INTERVAL = 6000

export function OrderTracker({ orderId, eventId, catalogSlug }: OrderTrackerProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const paymentResult = searchParams.get('payment_result')

  const [order, setOrder] = useState<OrderData | null>(null)
  const [loadError, setLoadError] = useState(false)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchOrder = async () => {
    try {
      const res = await fetch(catalogPaths.orderStatus(orderId), {
        headers: { 'X-Branded-Host': window.location.host },
      })
      if (!res.ok) { setLoadError(true); return }
      const data: OrderData = await res.json()
      setOrder(data)
      setLoadError(false)

      // Dejar de hacer polling si la orden ya está entregada o cancelada
      const terminal = ['delivered', 'cancelled'].includes(data.status)
      if (terminal && pollRef.current) {
        clearInterval(pollRef.current)
        pollRef.current = null
      }
    } catch {
      setLoadError(true)
    }
  }

  useEffect(() => {
    fetchOrder()
    pollRef.current = setInterval(fetchOrder, POLL_INTERVAL)
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId])

  const status = order ? normalizeStatus(order.status) : 'pending'
  const isPendingPayment = order?.status === 'pending_payment'
  const isPaid = order?.payment_status === 'paid'
  const isMP = order?.payment_method === 'mp'

  const formattedDate = order?.created_at
    ? new Date(order.created_at).toLocaleString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : ''

  return (
    <div className="flex flex-col min-h-screen bg-[#F7F7FA]">
      {/* Top bar */}
      <div className="sticky top-0 z-10 bg-white flex items-center px-4 h-[60px] shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
        <h1 className="text-[17px] font-bold absolute left-1/2 -translate-x-1/2 tracking-tight">
          Detalle del pedido
        </h1>
      </div>

      <div className="flex flex-col flex-1 p-4 gap-3 max-w-[480px] w-full mx-auto">

        {/* Banner de resultado de pago MP */}
        {paymentResult === 'success' && (
          <div className="bg-green-50 border border-green-200 rounded-2xl px-4 py-3 flex items-center gap-3">
            <span className="text-green-600 text-xl">✓</span>
            <p className="text-sm font-semibold text-green-800">
              ¡Pago aprobado! Tu pedido está siendo procesado.
            </p>
          </div>
        )}
        {paymentResult === 'pending' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl px-4 py-3">
            <p className="text-sm font-semibold text-yellow-800">
              Tu pago está siendo procesado por Mercado Pago.
            </p>
          </div>
        )}
        {paymentResult === 'failure' && (
          <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3">
            <p className="text-sm font-semibold text-red-800">
              El pago no pudo procesarse. Podés intentar de nuevo.
            </p>
          </div>
        )}

        {/* Alerta pago pendiente (MP no pagado) */}
        {isPendingPayment && isMP && !isPaid && order?.checkout_url && (
          <div className="bg-[#009EE3]/8 border border-[#009EE3]/25 rounded-2xl px-4 py-3 flex flex-col gap-2">
            <p className="text-sm font-semibold text-[#0077B6]">
              Tu pedido está reservado. Completá el pago para confirmarlo.
            </p>
            <a
              href={order.checkout_url}
              className="self-start text-sm font-bold text-[#009EE3] underline underline-offset-2"
            >
              Ir a Mercado Pago →
            </a>
          </div>
        )}

        {/* Error de carga */}
        {loadError && !order && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5 text-sm text-gray-400 text-center">
            No pudimos cargar tu pedido. Revisá tu conexión.
          </div>
        )}

        {/* Estado */}
        {order && !isPendingPayment && (
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
        )}

        {/* Skeleton mientras carga */}
        {!order && !loadError && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
            <div className="h-3 w-24 bg-gray-100 rounded mb-4" />
            <div className="flex flex-col gap-3">
              {[1,2,3,4].map(n => (
                <div key={n} className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-gray-100" />
                  <div className="h-3 w-32 bg-gray-100 rounded" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Items */}
        {order && order.items.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Productos</h2>
            {order.items.map((item, i) => (
              <div
                key={item.product_id ?? i}
                className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0"
              >
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-xs font-semibold text-gray-500 shrink-0">
                    {item.quantity}
                  </span>
                  <span className="text-sm text-gray-800">{item.product_name}</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">{formatPrice(item.subtotal)}</span>
              </div>
            ))}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
              <span className="font-semibold text-gray-900">Total</span>
              <span className="text-lg font-bold text-gray-900">{formatPrice(order.total_amount)}</span>
            </div>
          </div>
        )}

        {/* Info */}
        {order && (
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Información</h2>
            <div className="flex flex-col gap-2.5">
              {order.order_number && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Número de pedido</span>
                  <span className="font-mono font-semibold text-gray-900">#{order.order_number}</span>
                </div>
              )}
              {formattedDate && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Fecha</span>
                  <span className="font-medium text-gray-900">{formattedDate}</span>
                </div>
              )}
              {order.payment_method && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Método de pago</span>
                  <span className="font-medium text-gray-900">
                    {paymentLabels[order.payment_method] ?? order.payment_method}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Estado del pago</span>
                <span className={`font-semibold ${
                  order.payment_status === 'paid' ? 'text-green-600'
                  : order.payment_status === 'failed' ? 'text-red-500'
                  : 'text-yellow-600'
                }`}>
                  {order.payment_status === 'paid' ? 'Pagado'
                   : order.payment_status === 'failed' ? 'Fallido'
                   : 'Pendiente'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* CTA retiro */}
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
