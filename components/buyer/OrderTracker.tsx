'use client'

import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { QRCodeSVG } from 'qrcode.react'
import { Download } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import { catalogPaths } from '@/lib/api/paths'

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

const paymentLabels: Record<string, string> = {
  mp: 'Mercado Pago',
  cash: 'Efectivo',
  transfer: 'Transferencia',
}

const POLL_INTERVAL = 6000

export function OrderTracker({ orderId }: OrderTrackerProps) {
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


  const isPaid = order?.payment_status === 'approved'
  const isDelivered = order?.status === 'delivered'
  const isPendingPayment = order?.status === 'pending_payment'

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
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #order-print-area, #order-print-area * { visibility: visible; }
          #order-print-area {
            position: fixed; inset: 0;
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            gap: 16px; padding: 32px;
            background: white;
          }
        }
      `}</style>

      {/* Top bar */}
      <div className="sticky top-0 z-10 bg-white flex items-center px-4 h-[60px] shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
        <h1 className="text-[17px] font-bold absolute left-1/2 -translate-x-1/2 tracking-tight">
          Tu pedido
        </h1>
      </div>

      <div className="flex flex-col flex-1 p-4 gap-3 max-w-[480px] w-full mx-auto">

        {/* Banners de resultado de pago MP — solo si el pago no está ya aprobado en DB */}
        {!isPaid && paymentResult === 'success' && (
          <div className="bg-green-50 border border-green-200 rounded-2xl px-4 py-3 flex items-center gap-3">
            <span className="text-green-600 text-xl">✓</span>
            <p className="text-sm font-semibold text-green-800">
              ¡Pago aprobado! Tu pedido está confirmado.
            </p>
          </div>
        )}
        {!isPaid && paymentResult === 'pending' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl px-4 py-3">
            <p className="text-sm font-semibold text-yellow-800">
              Tu pago está siendo procesado por Mercado Pago.
            </p>
          </div>
        )}
        {!isPaid && paymentResult === 'failure' && (
          <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3">
            <p className="text-sm font-semibold text-red-800">
              El pago no pudo procesarse. Podés intentar de nuevo.
            </p>
          </div>
        )}

        {/* Alerta pago pendiente MP */}
        {isPendingPayment && order?.checkout_url && (
          <div className="bg-white rounded-2xl border border-[#009EE3]/30 p-4 flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <p className="text-[15px] font-bold text-gray-900">Tu pedido está reservado</p>
              <p className="text-sm text-gray-500">Completá el pago para confirmarlo.</p>
            </div>
            <button
              onClick={() => { window.location.href = order.checkout_url! }}
              className="w-full rounded-full py-3.5 text-[15px] font-bold text-white flex items-center justify-center gap-2"
              style={{ background: '#009EE3' }}
            >
              <svg width="20" height="20" viewBox="0 0 22 22" fill="none">
                <circle cx="11" cy="11" r="11" fill="white" fillOpacity="0.25"/>
                <rect x="5" y="7.5" width="12" height="7.5" rx="1.5" stroke="white" strokeWidth="1.25"/>
                <path d="M5 10.5h12" stroke="white" strokeWidth="1.25"/>
                <rect x="7" y="12.5" width="3" height="1.25" rx="0.5" fill="white"/>
              </svg>
              Pagar con Mercado Pago
            </button>
          </div>
        )}

        {/* Error de carga */}
        {loadError && !order && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5 text-sm text-gray-400 text-center">
            No pudimos cargar tu pedido. Revisá tu conexión.
          </div>
        )}

        {/* Finalizado */}
        {order && isDelivered && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-6 flex flex-col items-center gap-2 text-center">
            <span className="text-4xl">✓</span>
            <span className="text-[16px] font-bold text-green-800">¡Pedido finalizado!</span>
            <span className="text-sm text-green-600">Tu pedido fue entregado. ¡Gracias!</span>
          </div>
        )}

        {/* QR de retiro */}
        {order && isPaid && !isDelivered && (
          <div id="order-print-area" className="bg-white rounded-2xl border border-gray-100 p-6 flex flex-col items-center gap-4">
            <div className="flex flex-col items-center gap-1 text-center">
              <span className="text-[15px] font-bold text-gray-900">Presentá este QR en la barra</span>
              <span className="text-xs text-gray-400">El personal escaneará el código para entregar tu pedido</span>
            </div>
            <div className="p-3 bg-white border border-gray-100 rounded-2xl shadow-sm">
              <QRCodeSVG value={orderId} size={200} />
            </div>
            {order.order_number && (
              <span className="text-xs text-gray-400 font-mono">Pedido #{order.order_number}</span>
            )}
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
            >
              <Download size={14} />
              Descargar PDF
            </button>
          </div>
        )}

        {/* Skeleton mientras carga */}
        {!order && !loadError && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 flex flex-col items-center gap-4 animate-pulse">
            <div className="h-4 w-48 bg-gray-100 rounded" />
            <div className="w-[200px] h-[200px] bg-gray-100 rounded-xl" />
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
              {order.customer_name && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Cliente</span>
                  <span className="font-medium text-gray-900">{order.customer_name}</span>
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
                <span className="text-gray-400">Estado</span>
                <span className={`font-semibold ${
                  isDelivered ? 'text-green-600'
                  : order.payment_status === 'approved' ? 'text-blue-600'
                  : order.payment_status === 'rejected' || order.payment_status === 'cancelled' ? 'text-red-500'
                  : 'text-yellow-600'
                }`}>
                  {isDelivered ? 'Finalizado'
                   : order.payment_status === 'approved' ? 'Pagado'
                   : order.payment_status === 'rejected' ? 'Rechazado'
                   : order.payment_status === 'cancelled' ? 'Cancelado'
                   : order.payment_status === 'refunded' ? 'Reintegrado'
                   : 'Pendiente de pago'}
                </span>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
