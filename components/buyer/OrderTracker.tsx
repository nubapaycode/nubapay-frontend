'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { QRCodeSVG } from 'qrcode.react'
import { Download } from 'lucide-react'
import { Spinner } from '@/components/ui/Spinner'
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

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-3">
      <span className="text-[13px]" style={{ color: BUYER_COLORS.muted }}>{label}</span>
      <span className="text-[13px] font-medium" style={{ color: BUYER_COLORS.text }}>{children}</span>
    </div>
  )
}

// 0→80 rápido, 80→90 más lento, 90→95 más lento, 95→99 muy lento
// Cuando `done` es true, salta a 100
function useLoadingProgress(active: boolean): number {
  const [progress, setProgress] = useState(0)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    if (!active) { setProgress(100); return }
    setProgress(0)

    const segments = [
      { target: 80, duration: 600 },
      { target: 90, duration: 1400 },
      { target: 95, duration: 2800 },
      { target: 99, duration: 9000 },
    ]

    let idx = 0
    let segStart = performance.now()
    let segFrom = 0

    const easeOut = (t: number) => 1 - (1 - t) ** 2

    const tick = (now: number) => {
      if (idx >= segments.length) return
      const { target, duration } = segments[idx]
      const t = Math.min((now - segStart) / duration, 1)
      setProgress(segFrom + (target - segFrom) * easeOut(t))
      if (t >= 1) { idx++; segStart = now; segFrom = target }
      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [active])

  return progress
}

export function OrderTracker({ orderId, catalogSlug }: OrderTrackerProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const paymentResult = searchParams.get('payment_result')

  const [order, setOrder] = useState<OrderData | null>(null)
  const [loadError, setLoadError] = useState(false)
  const [showFlash, setShowFlash] = useState(false)
  const [redirecting, setRedirecting] = useState(false)
  const flashedRef = useRef(false)
  const loadingProgress = useLoadingProgress(!order && !loadError)
  const redirectProgress = useLoadingProgress(redirecting)

  const goToCheckout = (url: string) => {
    setRedirecting(true)
    setTimeout(() => { window.location.href = url }, 350)
  }
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
      goToCheckout(order.checkout_url)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order, paymentResult])

  const isPaid = order?.payment_status === 'approved'
  const isDelivered = order?.status === 'delivered'

  useEffect(() => {
    if (isPaid && order && !order.processing && !flashedRef.current) {
      flashedRef.current = true
      setShowFlash(true)
    }
  }, [isPaid, order])
  const isPendingPayment = order?.status === 'pending_payment'
  const isRejected = order?.payment_status === 'rejected'
  const isCancelled = order?.payment_status === 'cancelled'
  const isRefunded = order?.payment_status === 'refunded'

  const awaitingMpCheckout =
    !isPaid &&
    !paymentResult &&
    (!order || isPendingPayment || order.processing)
  const mpCheckoutReady = Boolean(order?.checkout_url)

  const formattedDate = order?.created_at
    ? new Date(order.created_at).toLocaleString('es-AR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })
    : ''

  // Status hero config
  type HeroState = {
    icon: React.ReactNode
    iconBg: string
    title: string
    subtitle: string
    heroBg: string
    heroBorder: string
    titleColor: string
    subtitleColor: string
  }

  const hero: HeroState | null = (() => {
    if (!order) return null
    if (isDelivered) return {
      icon: <path d="M4 11l5 5 9-9" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />,
      iconBg: '#16A34A',
      title: '¡Pedido entregado!',
      subtitle: 'Tu pedido fue retirado correctamente. ¡Gracias!',
      heroBg: '#F0FDF4',
      heroBorder: '#BBF7D0',
      titleColor: '#15803D',
      subtitleColor: '#16A34A',
    }
    if (isPaid) return {
      icon: <path d="M4 11l5 5 9-9" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />,
      iconBg: '#2563EB',
      title: 'Pago confirmado',
      subtitle: 'Presentá el QR en la barra para retirar tu pedido.',
      heroBg: '#EFF6FF',
      heroBorder: '#BFDBFE',
      titleColor: '#1D4ED8',
      subtitleColor: '#3B82F6',
    }
    if (isRejected || isCancelled) return {
      icon: <path d="M5 5l12 12M17 5L5 17" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />,
      iconBg: '#DC2626',
      title: isRejected ? 'Pago rechazado' : 'Pedido cancelado',
      subtitle: isRejected ? 'No pudimos procesar el pago. Podés intentar de nuevo.' : 'Este pedido fue cancelado.',
      heroBg: '#FEF2F2',
      heroBorder: '#FECACA',
      titleColor: '#991B1B',
      subtitleColor: '#EF4444',
    }
    if (isRefunded) return {
      icon: <path d="M12 4v8m0 4h.01" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />,
      iconBg: '#9333EA',
      title: 'Pago reintegrado',
      subtitle: 'El importe fue devuelto al método de pago original.',
      heroBg: '#FAF5FF',
      heroBorder: '#E9D5FF',
      titleColor: '#6B21A8',
      subtitleColor: '#9333EA',
    }
    if (order.processing) return {
      icon: null,
      iconBg: BUYER_COLORS.text,
      title: 'Procesando pedido…',
      subtitle: 'Esto tarda solo unos segundos.',
      heroBg: '#fff',
      heroBorder: BUYER_COLORS.border,
      titleColor: BUYER_COLORS.text,
      subtitleColor: BUYER_COLORS.muted,
    }
    // pending payment
    return null
  })()

  return (
    <div
      className="flex min-h-dvh flex-col"
      style={{ background: BUYER_COLORS.bg, fontFamily: BUYER_FONT }}
    >
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes ping-slow {
          0%, 100% { transform: scale(1);    opacity: 0.6; }
          50%       { transform: scale(1.18); opacity: 0; }
        }
        @keyframes flash-in-out {
          0%   { opacity: 0; }
          5%   { opacity: 1; }
          69%  { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes check-pop {
          0%   { transform: scale(0.3); opacity: 0; }
          70%  { transform: scale(1.1); opacity: 1; }
          100% { transform: scale(1);  opacity: 1; }
        }
        @keyframes draw-check {
          from { stroke-dashoffset: 56; }
          to   { stroke-dashoffset: 0; }
        }
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

      {/* Flash de pago aprobado */}
      {showFlash && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
          style={{ background: '#16A34A', animation: 'flash-in-out 3.2s ease-in-out forwards' }}
          onAnimationEnd={(e) => { if (e.target === e.currentTarget) setShowFlash(false) }}
        >
          <div style={{ animation: 'check-pop 0.7s cubic-bezier(0.34,1.56,0.64,1) 0.1s both' }}>
            <svg width="96" height="96" viewBox="0 0 88 88" fill="none" aria-hidden>
              <circle cx="44" cy="44" r="38" stroke="rgba(255,255,255,0.2)" strokeWidth="3" />
              <path
                d="M24 44l13 13 27-27"
                stroke="#fff"
                strokeWidth="5.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="56"
                strokeDashoffset="56"
                style={{ animation: 'draw-check 0.9s ease-out 0.2s forwards' }}
              />
            </svg>
          </div>
        </div>
      )}

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
          {order?.order_number ? `Pedido #${order.order_number}` : 'Tu pedido'}
        </span>
      </div>

      {/* Loader redirigiendo a Mercado Pago */}
      {redirecting && (
        <div className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center gap-6 px-4 py-10">
          <div
            className="flex w-full flex-col items-center gap-6 rounded-[22px] px-6 py-10"
            style={{ background: '#fff', border: `1px solid ${BUYER_COLORS.border}` }}
          >
            <div className="relative flex items-center justify-center" style={{ width: 80, height: 80 }}>
              <div
                className="absolute inset-0 rounded-full"
                style={{ border: `2px solid ${BUYER_COLORS.border}`, animation: 'ping-slow 2s ease-in-out infinite' }}
              />
              <div
                className="absolute rounded-full"
                style={{ inset: 10, border: `2px solid rgba(0,0,0,0.06)`, animation: 'ping-slow 2s ease-in-out infinite 0.4s' }}
              />
              <div
                className="flex items-center justify-center rounded-full"
                style={{ width: 44, height: 44, background: BUYER_COLORS.subtleFill }}
              >
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden>
                  <rect x="2" y="2" width="7" height="7" rx="1.5" stroke={BUYER_COLORS.text} strokeWidth="1.5" />
                  <rect x="13" y="2" width="7" height="7" rx="1.5" stroke={BUYER_COLORS.text} strokeWidth="1.5" />
                  <rect x="2" y="13" width="7" height="7" rx="1.5" stroke={BUYER_COLORS.text} strokeWidth="1.5" />
                  <rect x="4" y="4" width="3" height="3" rx="0.5" fill={BUYER_COLORS.text} />
                  <rect x="15" y="4" width="3" height="3" rx="0.5" fill={BUYER_COLORS.text} />
                  <rect x="4" y="15" width="3" height="3" rx="0.5" fill={BUYER_COLORS.text} />
                  <path d="M13 13h2m2 0h2M13 15v2m0 2h2m2-2h2m0 2h-2" stroke={BUYER_COLORS.text} strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>
            </div>

            <div className="flex flex-col items-center gap-1 text-center">
              <p className="text-[15px] font-bold" style={{ color: BUYER_COLORS.text }}>Preparando el pago…</p>
              <p className="text-[12px]" style={{ color: BUYER_COLORS.muted }}>Te vamos a redirigir a Mercado Pago en un momento.</p>
            </div>

            <div
              className="relative w-full overflow-hidden rounded-full"
              style={{ height: 4, background: BUYER_COLORS.subtleFill, maxWidth: 200 }}
            >
              <div
                className="absolute inset-y-0 left-0 rounded-full"
                style={{
                  width: `${redirectProgress}%`,
                  background: BUYER_COLORS.text,
                  transition: 'width 80ms linear',
                }}
              />
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-3 px-4 py-5" style={{ display: redirecting ? 'none' : undefined }}>

        {/* Loader */}
        {!order && !loadError && (
          <div
            className="flex flex-col items-center gap-6 rounded-[22px] px-6 py-10"
            style={{ background: '#fff', border: `1px solid ${BUYER_COLORS.border}` }}
          >
            {/* Icono animado con anillos */}
            <div className="relative flex items-center justify-center" style={{ width: 80, height: 80 }}>
              {/* anillo exterior pulsante */}
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  border: `2px solid ${BUYER_COLORS.border}`,
                  animation: 'ping-slow 2s ease-in-out infinite',
                }}
              />
              {/* anillo medio pulsante (desfasado) */}
              <div
                className="absolute rounded-full"
                style={{
                  inset: 10,
                  border: `2px solid rgba(0,0,0,0.06)`,
                  animation: 'ping-slow 2s ease-in-out infinite 0.4s',
                }}
              />
              {/* círculo interior estático */}
              <div
                className="flex items-center justify-center rounded-full"
                style={{ width: 44, height: 44, background: BUYER_COLORS.subtleFill }}
              >
                {/* ícono QR / pedido */}
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden>
                  <rect x="2" y="2" width="7" height="7" rx="1.5" stroke={BUYER_COLORS.text} strokeWidth="1.5" />
                  <rect x="13" y="2" width="7" height="7" rx="1.5" stroke={BUYER_COLORS.text} strokeWidth="1.5" />
                  <rect x="2" y="13" width="7" height="7" rx="1.5" stroke={BUYER_COLORS.text} strokeWidth="1.5" />
                  <rect x="4" y="4" width="3" height="3" rx="0.5" fill={BUYER_COLORS.text} />
                  <rect x="15" y="4" width="3" height="3" rx="0.5" fill={BUYER_COLORS.text} />
                  <rect x="4" y="15" width="3" height="3" rx="0.5" fill={BUYER_COLORS.text} />
                  <path d="M13 13h2m2 0h2M13 15v2m0 2h2m2-2h2m0 2h-2" stroke={BUYER_COLORS.text} strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>
            </div>

            <div className="flex flex-col items-center gap-1 text-center">
              <p className="text-[15px] font-bold" style={{ color: BUYER_COLORS.text }}>Cargando tu pedido…</p>
              <p className="text-[12px]" style={{ color: BUYER_COLORS.muted }}>Esto puede llegar a tardar unos minutos, no abandones la página.</p>
            </div>

            {/* Barra de carga */}
            <div
              className="relative w-full overflow-hidden rounded-full"
              style={{ height: 4, background: BUYER_COLORS.subtleFill, maxWidth: 200 }}
            >
              <div
                className="absolute inset-y-0 left-0 rounded-full"
                style={{
                  width: `${loadingProgress}%`,
                  background: BUYER_COLORS.text,
                  transition: 'width 80ms linear',
                }}
              />
            </div>
          </div>
        )}

        {/* Error */}
        {loadError && !order && (
          <div
            className="flex flex-col items-center gap-3 rounded-[18px] p-6 text-center"
            style={{ background: '#fff', border: `1px solid ${BUYER_COLORS.border}` }}
          >
            <div
              className="flex h-11 w-11 items-center justify-center rounded-full"
              style={{ background: '#FEF2F2' }}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
                <path d="M10 6v4m0 4h.01" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <p className="text-[14px] font-semibold" style={{ color: BUYER_COLORS.text }}>No pudimos cargar tu pedido</p>
              <p className="mt-0.5 text-[13px]" style={{ color: BUYER_COLORS.muted }}>Revisá tu conexión e intentá de nuevo.</p>
            </div>
          </div>
        )}

        {/* Banner resultado de pago (solo si no está pagado todavía) */}
        {!isPaid && paymentResult === 'success' && (
          <div
            className="flex items-center gap-3 rounded-[16px] px-4 py-3"
            style={{ background: '#F0FDF4', border: '1px solid #BBF7D0' }}
          >
            <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full" style={{ background: '#16A34A' }}>
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden>
                <path d="M2.5 7l3 3 6-6" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p className="text-[13px] font-semibold" style={{ color: '#15803D' }}>¡Pago aprobado! Tu pedido está confirmado.</p>
          </div>
        )}
        {!isPaid && paymentResult === 'pending' && (
          <div className="flex items-center gap-3 rounded-[16px] px-4 py-3" style={{ background: '#FFFBEB', border: '1px solid #FDE68A' }}>
            <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full" style={{ background: '#D97706' }}>
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden>
                <path d="M7 4v4m0 2.5h.01" stroke="#fff" strokeWidth="1.75" strokeLinecap="round" />
              </svg>
            </div>
            <p className="text-[13px] font-semibold" style={{ color: '#92400E' }}>Tu pago está siendo procesado por Mercado Pago.</p>
          </div>
        )}
        {!isPaid && paymentResult === 'failure' && (
          <div className="flex items-center gap-3 rounded-[16px] px-4 py-3" style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}>
            <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full" style={{ background: '#DC2626' }}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
                <path d="M3 3l6 6M9 3L3 9" stroke="#fff" strokeWidth="1.75" strokeLinecap="round" />
              </svg>
            </div>
            <p className="text-[13px] font-semibold" style={{ color: '#991B1B' }}>El pago no pudo procesarse. Podés intentar de nuevo.</p>
          </div>
        )}

        {/* Hero de estado */}
        {hero && (
          <div
            className="flex items-center gap-4 rounded-[18px] px-4 py-4"
            style={{ background: hero.heroBg, border: `1px solid ${hero.heroBorder}` }}
          >
            <div
              className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full"
              style={{ background: hero.iconBg }}
            >
              {hero.icon ? (
                <svg width="20" height="20" viewBox="0 0 22 22" fill="none" aria-hidden>
                  {hero.icon}
                </svg>
              ) : (
                <div
                  className="h-5 w-5 rounded-full border-2"
                  style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff', animation: 'spin 0.75s linear infinite' }}
                />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-[15px] font-bold leading-snug" style={{ color: hero.titleColor }}>{hero.title}</p>
              <p className="mt-0.5 text-[12px] leading-snug" style={{ color: hero.subtitleColor }}>{hero.subtitle}</p>
            </div>
          </div>
        )}

        {/* CTA pago MP pendiente */}
        {awaitingMpCheckout && !loadError && (
          <div
            className="flex flex-col gap-4 rounded-[18px] overflow-hidden"
            style={{ background: '#fff', border: `1px solid #FDE68A` }}
          >
            <div className="flex items-center gap-3 px-4 pt-4">
              <div
                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full"
                style={{ background: '#FFFBEB' }}
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
                  <circle cx="10" cy="10" r="8" stroke="#D97706" strokeWidth="1.75" />
                  <path d="M10 6v4.5" stroke="#D97706" strokeWidth="1.75" strokeLinecap="round" />
                  <circle cx="10" cy="13.5" r="0.875" fill="#D97706" />
                </svg>
              </div>
              <div>
                <p className="text-[15px] font-bold leading-tight" style={{ color: BUYER_COLORS.text }}>
                  Tu pedido está reservado
                </p>
                <p className="text-[12px] mt-0.5" style={{ color: BUYER_COLORS.muted }}>
                  Completá el pago para confirmar tu lugar.
                </p>
              </div>
            </div>

            <div className="px-4 pb-4 flex flex-col gap-3">
              <button
                type="button"
                disabled={!mpCheckoutReady}
                onClick={() => { if (order?.checkout_url) goToCheckout(order.checkout_url) }}
                className="flex h-[52px] w-full items-center justify-center gap-2.5 rounded-full text-[15px] font-bold transition-opacity disabled:opacity-70"
                style={{ background: 'rgba(0,158,227,0.18)', color: '#009EE3' }}
              >
                {mpCheckoutReady ? (
                  <>
                    <svg width="28" height="19" viewBox="206 130 288 210" fill="none" aria-hidden>
                      <path fill="#00bcff" d="m350.04,138.92c-77.83,0-140.91,40.36-140.91,90.15s63.09,94.05,140.91,94.05,140.91-44.27,140.91-94.05-63.09-90.15-140.91-90.15Z"/>
                      <path fill="#fff" d="m304.18,201.2c-.07.14-1.45,1.56-.55,2.71,2.18,2.78,8.91,4.38,15.72,2.85,4.05-.91,9.25-5.04,14.28-9.03,5.45-4.33,10.86-8.67,16.3-10.39,5.76-1.83,9.45-1.05,11.89-.31,2.67.8,5.82,2.56,10.84,6.32,9.45,7.1,47.43,40.26,54,45.99,5.28-2.39,30.47-12.56,62.39-19.6-2.78-17.02-13.01-33.25-28.72-45.99-21.89,9.19-50.42,14.7-76.58,1.93-.13-.05-14.29-6.75-28.25-6.42-20.75.48-29.74,9.46-39.25,18.97l-12.05,12.99Z"/>
                      <path fill="#fff" d="m425.1,242.95c-.45-.4-44.67-39.09-54.69-46.62-5.8-4.35-9.02-5.46-12.41-5.89-1.76-.23-4.2.1-5.9.57-4.66,1.27-10.75,5.34-16.16,9.63-5.6,4.46-10.88,8.66-15.79,9.76-6.26,1.4-13.91-.25-17.4-2.61-1.41-.95-2.41-2.05-2.89-3.16-1.29-2.99,1.09-5.38,1.48-5.78l12.2-13.2c1.42-1.41,2.85-2.83,4.31-4.23-3.94.51-7.58,1.52-11.12,2.5-4.42,1.24-8.68,2.42-12.98,2.42-1.8,0-11.42-1.58-13.25-2.07-11.05-3.02-23.56-5.97-38.04-12.73-17.35,12.91-28.65,28.77-32,46.56,2.49.66,9.02,2.15,10.71,2.52,39.26,8.73,51.49,17.72,53.71,19.6,2.4-2.67,5.87-4.36,9.73-4.36,4.35,0,8.26,2.19,10.64,5.56,2.25-1.78,5.35-3.3,9.36-3.29,1.82,0,3.71.34,5.62.98,4.43,1.52,6.72,4.47,7.9,7.14,1.48-.67,3.31-1.17,5.46-1.16,2.12,0,4.32.48,6.53,1.44,7.24,3.11,8.36,10.22,7.71,15.58.52-.06,1.04-.08,1.56-.08,8.58,0,15.56,6.98,15.56,15.57,0,2.66-.68,5.16-1.86,7.35,2.34,1.31,8.29,4.28,13.52,3.62,4.17-.53,5.76-1.95,6.32-2.76.39-.55.8-1.2.42-1.66l-11.08-12.3s-1.82-1.73-1.22-2.39c.62-.68,1.75.3,2.55.96,5.64,4.71,12.52,11.81,12.52,11.81.12.08.57.98,3.12,1.43,2.19.39,6.07.17,8.76-2.04.67-.56,1.35-1.25,1.93-1.97-.05.04-.09.08-.13.1,2.84-3.63-.32-7.29-.32-7.29l-12.93-14.52s-1.85-1.71-1.22-2.4c.56-.6,1.75.3,2.56.98,4.09,3.42,9.88,9.23,15.42,14.66,1.09.79,5.96,3.8,12.41-.43,3.92-2.57,4.7-5.73,4.59-8.1-.27-3.15-2.73-5.4-2.73-5.4l-17.66-17.76s-1.87-1.59-1.21-2.4c.54-.68,1.75.3,2.55.96,5.62,4.71,20.86,18.68,20.86,18.68.22.15,5.48,3.9,11.99-.24,2.33-1.49,3.81-3.73,3.94-6.34.22-4.52-2.96-7.2-2.96-7.2Z"/>
                      <path fill="#fff" d="m339.41,265.46c-2.74-.03-5.74,1.6-6.13,1.36-.22-.14.17-1.24.42-1.88.27-.63,3.87-11.48-4.92-15.25-6.73-2.89-10.85.36-12.26,1.83-.37.38-.54.35-.58-.13-.14-1.96-1.01-7.24-6.82-9.02-8.3-2.54-13.64,3.25-14.99,5.35-.61-4.73-4.61-8.4-9.5-8.41-5.32,0-9.64,4.3-9.65,9.63,0,5.32,4.31,9.64,9.64,9.64,2.59,0,4.93-1.03,6.66-2.69.06.05.08.14.05.32-.41,2.39-1.15,11.04,7.92,14.57,3.64,1.41,6.73.36,9.29-1.43.76-.54.89-.31.78.41-.33,2.23.09,6.99,6.77,9.7,5.08,2.07,8.09-.04,10.07-1.87.86-.78,1.09-.65,1.14.56.24,6.44,5.59,11.56,12.09,11.57,6.7,0,12.13-5.41,12.13-12.1,0-6.7-5.42-12.06-12.12-12.13Z"/>
                      <path fill="#0a0080" d="m350.01,135.19c-79.31,0-143.6,42.18-143.6,93.92,0,1.34-.02,5.03-.02,5.5,0,54.9,56.19,99.35,143.6,99.35s143.61-44.45,143.61-99.34v-5.51c0-51.74-64.29-93.92-143.59-93.92Zm137.12,83.51c-31.21,6.94-54.49,17.01-60.32,19.61-13.62-11.89-45.1-39.26-53.63-45.66-4.87-3.67-8.2-5.6-11.12-6.47-1.31-.4-3.12-.85-5.45-.85-2.17,0-4.5.39-6.93,1.17-5.51,1.75-11,6.11-16.31,10.33l-.27.22c-4.95,3.93-10.06,8-13.93,8.86-1.69.38-3.43.58-5.16.58-4.34,0-8.23-1.26-9.69-3.12-.24-.31-.08-.81.48-1.52l.07-.1,11.99-12.91c9.39-9.39,18.25-18.25,38.66-18.72.34-.01.68-.02,1.02-.02,12.7.01,25.4,5.69,26.83,6.36,11.91,5.81,24.21,8.76,36.56,8.77,12.85,0,26.11-3.17,40.05-9.58,14.56,12.24,24.21,26.99,27.15,43.06Zm-137.1-77.97c42.1,0,79.76,12.07,105.09,31.07-12.24,5.3-23.91,7.97-35.17,7.97-11.52-.01-23.03-2.78-34.21-8.23-.59-.28-14.61-6.89-29.2-6.9-.38,0-.77,0-1.15.01-17.14.4-26.8,6.49-33.29,11.82-6.31.16-11.76,1.68-16.61,3.03-4.33,1.2-8.06,2.24-11.7,2.24-1.5,0-4.2-.14-4.44-.15-4.18-.13-25.18-5.28-41.95-11.61,25.27-17.96,61.89-29.26,102.64-29.26Zm-107.61,33.01c17.51,7.16,38.76,12.7,45.48,13.13,1.87.12,3.87.34,5.87.34,4.46,0,8.91-1.25,13.21-2.45,2.54-.71,5.35-1.49,8.3-2.05-.79.77-1.58,1.56-2.37,2.35l-12.17,13.17c-.96.97-3.04,3.55-1.67,6.73.54,1.28,1.65,2.51,3.2,3.55,2.9,1.95,8.1,3.28,12.92,3.28,1.83,0,3.57-.18,5.15-.54,5.11-1.14,10.46-5.41,16.13-9.92,4.52-3.59,10.94-8.15,15.86-9.49,1.38-.37,3.06-.61,4.42-.61.41,0,.79.02,1.14.07,3.24.41,6.38,1.51,11.99,5.72,10,7.51,54.22,46.2,54.65,46.58.03.02,2.85,2.46,2.65,6.5-.11,2.26-1.36,4.26-3.54,5.65-1.89,1.2-3.83,1.81-5.8,1.81-2.96,0-4.99-1.39-5.13-1.48-.16-.13-15.31-14.03-20.89-18.7-.89-.74-1.75-1.4-2.62-1.4-.47,0-.88.2-1.16.55-.88,1.08.1,2.58,1.26,3.56l17.7,17.8s2.21,2.06,2.45,4.79c.14,2.95-1.27,5.42-4.2,7.34-2.09,1.38-4.2,2.07-6.27,2.07-2.72,0-4.63-1.24-5.05-1.53l-2.54-2.5c-4.64-4.57-9.43-9.29-12.94-12.21-.86-.71-1.77-1.37-2.64-1.37-.43,0-.82.16-1.12.48-.4.44-.68,1.24.32,2.57.4.55.89,1,.89,1l12.91,14.51c.1.13,2.66,3.17.29,6.19l-.46.58c-.39.42-.8.82-1.2,1.16-2.2,1.81-5.14,2-6.31,2-.63,0-1.22-.05-1.75-.15-1.27-.23-2.13-.58-2.55-1.07l-.16-.16c-.7-.73-7.21-7.38-12.6-11.87-.71-.6-1.6-1.34-2.51-1.34-.45,0-.85.18-1.17.52-1.06,1.17.54,2.91,1.22,3.55l11.01,12.15c-.01.11-.15.36-.41.74-.4.55-1.73,1.88-5.73,2.38-.48.06-.98.09-1.46.09-4.12,0-8.52-2-10.79-3.2,1.03-2.18,1.57-4.58,1.57-6.98,0-9.07-7.36-16.44-16.43-16.45-.19,0-.4,0-.59.01.29-4.14-.29-11.98-8.34-15.43-2.32-1-4.63-1.52-6.87-1.52-1.76,0-3.45.3-5.04.91-1.67-3.24-4.44-5.6-8.04-6.83-2-.69-3.98-1.04-5.9-1.04-3.35,0-6.44.99-9.19,2.94-2.64-3.28-6.62-5.22-10.81-5.22-3.67,0-7.2,1.47-9.81,4.06-3.43-2.62-17.03-11.26-53.44-19.53-1.74-.39-5.69-1.52-8.17-2.25,3.41-16.34,13.8-31.27,29.2-43.52Zm67.54,94.78l-.39-.35h-.4c-.32,0-.66.13-1.11.45-1.86,1.31-3.63,1.94-5.44,1.94-1,0-2.02-.2-3.04-.59-8.44-3.29-7.78-11.25-7.36-13.65.06-.49-.06-.86-.37-1.12l-.6-.49-.56.53c-1.65,1.59-3.8,2.45-6.06,2.45-4.83,0-8.77-3.93-8.76-8.77,0-4.83,3.94-8.76,8.78-8.75,4.37,0,8.09,3.28,8.64,7.65l.3,2.35,1.29-1.99c.14-.23,3.69-5.59,10.2-5.58,1.24,0,2.52.2,3.81.6,5.19,1.58,6.07,6.29,6.2,8.25.09,1.14.91,1.2,1.06,1.2.45,0,.78-.28,1.01-.53.98-1.02,3.11-2.72,6.45-2.72,1.53,0,3.15.37,4.83,1.09,8.25,3.54,4.51,14.02,4.47,14.13-.71,1.74-.74,2.5-.07,2.95l.32.15h.24c.37,0,.83-.16,1.6-.42,1.12-.39,2.81-.97,4.4-.97h0c6.21.07,11.26,5.13,11.26,11.26,0,6.2-5.06,11.24-11.27,11.24-6.07,0-11.01-4.73-11.23-10.74-.02-.52-.07-1.88-1.23-1.88-.47,0-.89.29-1.36.72-1.34,1.24-3.04,2.49-5.52,2.49-1.13,0-2.35-.26-3.64-.79-6.41-2.6-6.5-7-6.24-8.77.07-.47.09-.96-.23-1.35Zm40.07,48.88c-76.26,0-138.08-39.55-138.08-88.33,0-1.96.14-3.91.33-5.84.61.15,6.67,1.59,7.92,1.88,37.19,8.26,49.48,16.85,51.56,18.48-.7,1.69-1.07,3.51-1.07,5.35,0,7.69,6.25,13.95,13.93,13.95.86,0,1.72-.08,2.56-.24,1.16,5.66,4.86,9.95,10.51,12.15,1.65.63,3.32.96,4.97.96,1.06,0,2.13-.13,3.17-.39,1.05,2.65,3.39,5.96,8.65,8.09,1.84.74,3.68,1.13,5.47,1.13,1.46,0,2.89-.26,4.25-.76,2.52,6.13,8.51,10.2,15.19,10.2,4.43,0,8.68-1.8,11.78-4.99,2.65,1.48,8.25,4.15,13.91,4.16.73,0,1.41-.05,2.11-.13,5.62-.71,8.23-2.91,9.43-4.62.22-.3.41-.62.58-.95,1.32.38,2.78.69,4.46.7,3.07,0,6.01-1.05,8.99-3.21,2.93-2.11,5.01-5.14,5.31-7.72,0-.03,0-.07.01-.11.99.2,2,.3,3.01.3,3.16,0,6.27-.98,9.24-2.93,5.73-3.75,6.72-8.66,6.63-11.87,1.01.21,2.03.32,3.05.32,2.96,0,5.88-.89,8.65-2.66,3.55-2.27,5.69-5.75,6.02-9.79.21-2.75-.47-5.53-1.91-7.91,9.58-4.13,31.48-12.12,57.27-17.93.11,1.46.17,2.93.17,4.41,0,48.78-61.82,88.33-138.07,88.33Z"/>
                    </svg>
                    Pagar con Mercado Pago
                  </>
                ) : (
                  <>
                    <Spinner size="sm" className="text-white" />
                    Preparando Mercado Pago…
                  </>
                )}
              </button>
              <p className="text-center text-[11px]" style={{ color: BUYER_COLORS.muted }}>
                Si no completás el pago, el pedido se cancelará automáticamente.
              </p>
            </div>
          </div>
        )}

        {/* QR de retiro */}
        {order && isPaid && !isDelivered && (
          <div
            id="order-print-area"
            className="flex flex-col items-center gap-5 rounded-[18px] px-6 py-6"
            style={{ background: '#fff', border: `1px solid ${BUYER_COLORS.border}` }}
          >
            <div className="flex flex-col items-center gap-1 text-center">
              <p className="text-[16px] font-bold tracking-tight" style={{ color: BUYER_COLORS.text, letterSpacing: '-0.02em' }}>
                Presentá este QR en el punto indicado
              </p>
              <p className="text-[12px]" style={{ color: BUYER_COLORS.muted }}>
                El personal escaneará el código para entregarte tu pedido
              </p>
            </div>
            <div
              className="rounded-[18px] p-4"
              style={{
                border: `2px solid #BFDBFE`,
                background: '#EFF6FF',
              }}
            >
              <QRCodeSVG value={orderId} size={192} />
            </div>
            {order.order_number && (
              <span
                className="rounded-full px-4 py-1.5 font-mono text-[13px] font-semibold"
                style={{ background: BUYER_COLORS.subtleFill, color: BUYER_COLORS.text }}
              >
                Pedido #{order.order_number}
              </span>
            )}
            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-semibold transition-opacity active:opacity-70"
              style={{ border: `1px solid ${BUYER_COLORS.border}`, color: BUYER_COLORS.muted, background: BUYER_COLORS.subtleFill }}
            >
              <Download size={13} />
              Descargar PDF
            </button>
          </div>
        )}

        {/* Finalizado — CTA volver */}
        {order && isDelivered && catalogSlug && (
          <button
            type="button"
            onClick={() => router.push(`/catalogo/${catalogSlug}`)}
            className="flex h-[50px] w-full items-center justify-center rounded-full text-[15px] font-bold transition-opacity active:opacity-80"
            style={{ background: '#16A34A', color: '#fff' }}
          >
            Volver a pedir
          </button>
        )}

        {/* Productos */}
        {order && order.items.length > 0 && (
          <div
            className="rounded-[18px] overflow-hidden"
            style={{ background: '#fff', border: `1px solid ${BUYER_COLORS.border}` }}
          >
            <div className="px-4 pt-4 pb-2">
              <p className="text-[13px] font-semibold tracking-wide" style={{ color: BUYER_COLORS.muted, letterSpacing: '0.06em' }}>
                Productos
              </p>
            </div>
            <div>
              {order.items.map((item, i) => (
                <div key={item.product_id ?? i}>
                  {i > 0 && <div style={{ height: 1, background: BUYER_COLORS.border, marginLeft: 16, marginRight: 16 }} />}
                  <div className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-[6px] text-[12px] font-bold"
                        style={{ background: BUYER_COLORS.subtleFill, color: BUYER_COLORS.text }}
                      >
                        {item.quantity}
                      </span>
                      <span className="truncate text-[14px] font-medium" style={{ color: BUYER_COLORS.text }}>
                        {item.product_name}
                      </span>
                    </div>
                    <span className="ml-3 flex-shrink-0 text-[13px] font-semibold" style={{ color: BUYER_COLORS.text }}>
                      {formatPrice(item.subtotal)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div
              className="flex items-center justify-between px-4 py-3 mt-1"
              style={{ borderTop: `1px solid ${BUYER_COLORS.border}` }}
            >
              <span className="text-[14px] font-bold" style={{ color: BUYER_COLORS.text }}>Total</span>
              <span className="text-[18px] font-bold tracking-tight" style={{ color: BUYER_COLORS.text, letterSpacing: '-0.03em' }}>
                {formatPrice(order.total_amount)}
              </span>
            </div>
          </div>
        )}

        {/* Información del pedido */}
        {order && (
          <div
            className="rounded-[18px] overflow-hidden pb-2"
            style={{ background: '#fff', border: `1px solid ${BUYER_COLORS.border}` }}
          >
            <div className="px-4 pt-4 pb-0">
              <p className="text-[13px] font-semibold tracking-wide" style={{ color: BUYER_COLORS.muted, letterSpacing: '0.06em' }}>
                Información
              </p>
            </div>
            <div className="px-4 divide-y divide-gray-100">
              {order.order_number && (
                <InfoRow label="Número de pedido">
                  <span className="font-mono">#{order.order_number}</span>
                </InfoRow>
              )}
              {order.customer_name && (
                <InfoRow label="Cliente">{order.customer_name}</InfoRow>
              )}
              {formattedDate && (
                <InfoRow label="Fecha">{formattedDate}</InfoRow>
              )}
              {order.payment_method && (
                <InfoRow label="Método de pago">
                  {paymentLabels[order.payment_method] ?? order.payment_method}
                </InfoRow>
              )}
              <InfoRow label="Estado">
                <span
                  className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                  style={{
                    background: isDelivered ? '#F0FDF4' : isPaid ? '#EFF6FF' : (isRejected || isCancelled) ? '#FEF2F2' : isRefunded ? '#FAF5FF' : '#FFFBEB',
                    color: isDelivered ? '#16A34A' : isPaid ? '#2563EB' : (isRejected || isCancelled) ? '#DC2626' : isRefunded ? '#9333EA' : '#D97706',
                  }}
                >
                  {isDelivered ? 'Finalizado' : isPaid ? 'Pagado' : isRejected ? 'Rechazado' : isCancelled ? 'Cancelado' : isRefunded ? 'Reintegrado' : 'Pendiente de pago'}
                </span>
              </InfoRow>
            </div>
          </div>
        )}

        <div className="h-4" />
      </div>
    </div>
  )
}
