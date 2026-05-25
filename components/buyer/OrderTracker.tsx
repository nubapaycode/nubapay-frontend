'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { QRCodeSVG } from 'qrcode.react'
import { Download } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import { catalogPaths } from '@/lib/api/paths'
import { BUYER_COLORS, BUYER_FONT } from '@/lib/buyerUi'

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
  processing: boolean
  items: { product_id: string | null; product_name: string; unit_price: number; quantity: number; subtotal: number }[]
  created_at: string
}

const paymentLabels: Record<string, string> = {
  mp: 'Mercado Pago',
  cash: 'Efectivo',
  transfer: 'Transferencia',
}

const POLL_FAST = 1500
const POLL_SLOW = 6000

export function OrderTracker({ orderId, catalogSlug }: OrderTrackerProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const paymentResult = searchParams.get('payment_result')

  const [order, setOrder] = useState<OrderData | null>(null)
  const [loadError, setLoadError] = useState(false)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const processingRef = useRef<boolean>(true)
  const hasRedirectedRef = useRef(false)

  const fetchOrder = async () => {
    try {
      const res = await fetch(catalogPaths.orderStatus(orderId), {
        headers: { 'X-Branded-Host': window.location.host },
      })
      if (!res.ok) { setLoadError(true); return }
      const data: OrderData = await res.json()
      setOrder(data)
      setLoadError(false)
      if (processingRef.current && !data.processing) {
        processingRef.current = false
        if (pollRef.current) clearInterval(pollRef.current)
        pollRef.current = setInterval(fetchOrder, POLL_SLOW)
      }
    } catch {
      setLoadError(true)
    }
  }

  useEffect(() => {
    processingRef.current = true
    hasRedirectedRef.current = false
    fetchOrder()
    pollRef.current = setInterval(fetchOrder, POLL_FAST)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId])

  useEffect(() => {
    if (
      !hasRedirectedRef.current &&
      order && !order.processing &&
      order.checkout_url &&
      order.payment_status !== 'approved' &&
      !paymentResult
    ) {
      hasRedirectedRef.current = true
      window.location.href = order.checkout_url
    }
  }, [order, paymentResult])

  const isPaid = order?.payment_status === 'approved'
  const isDelivered = order?.status === 'delivered'
  const isPendingPayment = order?.status === 'pending_payment'

  const formattedDate = order?.created_at
    ? new Date(order.created_at).toLocaleString('es-AR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })
    : ''

  const statusLabel = isDelivered ? 'Finalizado'
    : isPaid ? 'Pagado'
    : order?.payment_status === 'rejected' ? 'Rechazado'
    : order?.payment_status === 'cancelled' ? 'Cancelado'
    : order?.payment_status === 'refunded' ? 'Reintegrado'
    : 'Pendiente de pago'

  const statusColor = isDelivered ? '#16A34A'
    : isPaid ? '#2563EB'
    : order?.payment_status === 'rejected' || order?.payment_status === 'cancelled' ? '#DC2626'
    : '#D97706'

  const statusBg = isDelivered ? '#F0FDF4'
    : isPaid ? '#EFF6FF'
    : order?.payment_status === 'rejected' || order?.payment_status === 'cancelled' ? '#FEF2F2'
    : '#FFFBEB'

  return (
    <div
      className="flex min-h-dvh flex-col"
      style={{ background: BUYER_COLORS.bg, fontFamily: BUYER_FONT }}
    >
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media print {
          body * { visibility: hidden; }
          #order-print-area, #order-print-area * { visibility: visible; }
          #order-print-area {
            position: fixed; inset: 0;
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            gap: 16px; padding: 32px; background: white;
          }
        }
      `}</style>

      {/* Header */}
      <div
        className="sticky top-0 z-10 flex h-[60px] items-center px-4"
        style={{
          background: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderBottom: `1px solid ${BUYER_COLORS.border}`,
        } as React.CSSProperties}
      >
        {catalogSlug && (
          <button
            type="button"
            onClick={() => router.push(`/catalogo/${catalogSlug}`)}
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full transition-colors"
            style={{ background: BUYER_COLORS.subtleFill }}
            aria-label="Volver al catálogo"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
              <path d="M11 4L6 9l5 5" stroke={BUYER_COLORS.text} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
        <span
          className="absolute left-1/2 -translate-x-1/2 text-[16px] font-bold tracking-tight"
          style={{ color: BUYER_COLORS.text, letterSpacing: '-0.02em' }}
        >
          Tu pedido
        </span>
      </div>

      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-3 px-4 py-5">

        {/* Banners resultado pago */}
        {!isPaid && paymentResult === 'success' && (
          <div
            className="flex items-center gap-3 rounded-[16px] px-4 py-3"
            style={{ background: '#F0FDF4', border: '1px solid #BBF7D0' }}
          >
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full" style={{ background: '#16A34A' }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                <path d="M2.5 7l3 3 6-6" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p className="text-[14px] font-semibold" style={{ color: '#15803D' }}>¡Pago aprobado! Tu pedido está confirmado.</p>
          </div>
        )}
        {!isPaid && paymentResult === 'pending' && (
          <div className="rounded-[16px] px-4 py-3" style={{ background: '#FFFBEB', border: '1px solid #FDE68A' }}>
            <p className="text-[14px] font-semibold" style={{ color: '#92400E' }}>Tu pago está siendo procesado por Mercado Pago.</p>
          </div>
        )}
        {!isPaid && paymentResult === 'failure' && (
          <div className="rounded-[16px] px-4 py-3" style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}>
            <p className="text-[14px] font-semibold" style={{ color: '#991B1B' }}>El pago no pudo procesarse. Podés intentar de nuevo.</p>
          </div>
        )}

        {/* Pago pendiente MP */}
        {isPendingPayment && order?.checkout_url && (
          <div
            className="flex flex-col gap-3 rounded-[18px] p-4"
            style={{ background: '#fff', border: `1px solid rgba(0,158,227,0.3)` }}
          >
            <div>
              <p className="text-[16px] font-bold" style={{ color: BUYER_COLORS.text }}>Tu pedido está reservado</p>
              <p className="mt-0.5 text-[13px]" style={{ color: BUYER_COLORS.muted }}>Completá el pago para confirmarlo.</p>
            </div>
            <button
              type="button"
              onClick={() => { window.location.href = order.checkout_url! }}
              className="flex h-[50px] w-full items-center justify-center gap-2 rounded-full text-[15px] font-bold text-white"
              style={{ background: '#009EE3' }}
            >
              Pagar con Mercado Pago
            </button>
          </div>
        )}

        {/* Error */}
        {loadError && !order && (
          <div
            className="rounded-[18px] p-5 text-center text-[14px]"
            style={{ background: '#fff', border: `1px solid ${BUYER_COLORS.border}`, color: BUYER_COLORS.muted }}
          >
            No pudimos cargar tu pedido. Revisá tu conexión.
          </div>
        )}

        {/* Procesando */}
        {order?.processing && (
          <div
            className="flex flex-col items-center gap-3 rounded-[18px] p-6"
            style={{ background: '#fff', border: `1px solid ${BUYER_COLORS.border}` }}
          >
            <div
              className="h-9 w-9 rounded-full border-[3px]"
              style={{ borderColor: BUYER_COLORS.border, borderTopColor: BUYER_COLORS.text, animation: 'spin 0.75s linear infinite' }}
            />
            <p className="text-[14px] font-semibold" style={{ color: BUYER_COLORS.text }}>Procesando tu pedido…</p>
            <p className="text-[12px] text-center" style={{ color: BUYER_COLORS.muted }}>Esto tarda solo unos segundos.</p>
          </div>
        )}

        {/* Finalizado */}
        {order && isDelivered && (
          <div
            className="flex flex-col items-center gap-3 rounded-[18px] p-6 text-center"
            style={{ background: '#F0FDF4', border: '1px solid #BBF7D0' }}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full" style={{ background: '#16A34A' }}>
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden>
                <path d="M4 11l5 5 9-9" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p className="text-[17px] font-bold" style={{ color: '#15803D' }}>¡Pedido finalizado!</p>
            <p className="text-[13px]" style={{ color: '#16A34A' }}>Tu pedido fue entregado. ¡Gracias!</p>
            {catalogSlug && (
              <button
                type="button"
                onClick={() => router.push(`/catalogo/${catalogSlug}`)}
                className="mt-1 flex h-[44px] w-full items-center justify-center rounded-full text-[14px] font-bold transition-opacity active:opacity-80"
                style={{ background: '#16A34A', color: '#fff' }}
              >
                Volver a pedir
              </button>
            )}
          </div>
        )}

        {/* Skeleton */}
        {!order && !loadError && (
          <div
            className="flex animate-pulse flex-col items-center gap-4 rounded-[18px] p-6"
            style={{ background: '#fff', border: `1px solid ${BUYER_COLORS.border}` }}
          >
            <div className="h-4 w-48 rounded-full" style={{ background: BUYER_COLORS.subtleFill }} />
            <div className="h-[200px] w-[200px] rounded-[14px]" style={{ background: BUYER_COLORS.subtleFill }} />
          </div>
        )}

        {/* QR de retiro */}
        {order && isPaid && !isDelivered && (
          <div
            id="order-print-area"
            className="flex flex-col items-center gap-4 rounded-[18px] p-6"
            style={{ background: '#fff', border: `1px solid ${BUYER_COLORS.border}` }}
          >
            <div className="flex flex-col items-center gap-1 text-center">
              <p className="text-[16px] font-bold" style={{ color: BUYER_COLORS.text }}>Presentá este QR en la barra</p>
              <p className="text-[13px]" style={{ color: BUYER_COLORS.muted }}>El personal escaneará el código para entregar tu pedido</p>
            </div>
            <div
              className="rounded-[16px] p-3"
              style={{ border: `1px solid ${BUYER_COLORS.border}` }}
            >
              <QRCodeSVG value={orderId} size={200} />
            </div>
            {order.order_number && (
              <span className="font-mono text-[13px]" style={{ color: BUYER_COLORS.muted }}>
                Pedido #{order.order_number}
              </span>
            )}
            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-semibold transition-colors"
              style={{ border: `1px solid ${BUYER_COLORS.border}`, color: BUYER_COLORS.text, background: BUYER_COLORS.subtleFill }}
            >
              <Download size={14} />
              Descargar PDF
            </button>
          </div>
        )}

        {/* Items */}
        {order && order.items.length > 0 && (
          <div>
            <p className="mb-3 text-[18px] font-bold" style={{ color: BUYER_COLORS.text }}>Productos</p>
            <div className="flex flex-col gap-3">
              {order.items.map((item, i) => (
                <div
                  key={item.product_id ?? i}
                  className="flex items-center justify-between rounded-[18px] bg-white px-4 py-3"
                  style={{ border: `1px solid ${BUYER_COLORS.border}` }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-[8px] text-[13px] font-bold"
                      style={{ background: BUYER_COLORS.subtleFill, color: BUYER_COLORS.text }}
                    >
                      {item.quantity}
                    </span>
                    <span className="truncate text-[14px] font-medium" style={{ color: BUYER_COLORS.text }}>
                      {item.product_name}
                    </span>
                  </div>
                  <span className="ml-3 flex-shrink-0 text-[14px] font-semibold" style={{ color: BUYER_COLORS.text }}>
                    {formatPrice(item.subtotal)}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center justify-between px-1">
              <span className="text-[15px] font-semibold" style={{ color: BUYER_COLORS.text }}>Total</span>
              <span className="text-[20px] font-semibold tracking-tight" style={{ color: BUYER_COLORS.text, letterSpacing: '-0.03em' }}>
                {formatPrice(order.total_amount)}
              </span>
            </div>
          </div>
        )}

        {/* Info */}
        {order && (
          <div className="flex flex-col gap-2 pb-6">
            <p className="mb-1 text-[18px] font-bold" style={{ color: BUYER_COLORS.text }}>Información</p>
            {order.order_number && (
              <div className="flex items-center justify-between">
                <span className="text-[14px]" style={{ color: BUYER_COLORS.muted }}>Número de pedido</span>
                <span className="font-mono text-[14px] font-semibold" style={{ color: BUYER_COLORS.text }}>#{order.order_number}</span>
              </div>
            )}
            {order.customer_name && (
              <div className="flex items-center justify-between">
                <span className="text-[14px]" style={{ color: BUYER_COLORS.muted }}>Cliente</span>
                <span className="text-[14px] font-medium" style={{ color: BUYER_COLORS.text }}>{order.customer_name}</span>
              </div>
            )}
            {formattedDate && (
              <div className="flex items-center justify-between">
                <span className="text-[14px]" style={{ color: BUYER_COLORS.muted }}>Fecha</span>
                <span className="text-[14px] font-medium" style={{ color: BUYER_COLORS.text }}>{formattedDate}</span>
              </div>
            )}
            {order.payment_method && (
              <div className="flex items-center justify-between">
                <span className="text-[14px]" style={{ color: BUYER_COLORS.muted }}>Método de pago</span>
                <span className="text-[14px] font-medium" style={{ color: BUYER_COLORS.text }}>
                  {paymentLabels[order.payment_method] ?? order.payment_method}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-[14px]" style={{ color: BUYER_COLORS.muted }}>Estado</span>
              <span
                className="rounded-full px-3 py-1 text-[12px] font-semibold"
                style={{ background: statusBg, color: statusColor }}
              >
                {statusLabel}
              </span>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
