'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

import { catalogPaths } from '@/lib/api/paths'
import { buyerFlowPath } from '@/lib/buyerRoutes'
import { BUYER_COLORS, BUYER_FONT } from '@/lib/buyerUi'
import { useCart } from '@/lib/hooks/useCart'
import { saveOrder } from '@/lib/hooks/useOrderHistory'
import {
  cartItemsKey,
  clearPendingOrder,
  loadPendingOrder,
  pendingIdempotencyKey,
  savePendingOrder,
} from '@/lib/pendingOrder'
import { computeCartTotals, orderLinePayload } from '@/lib/serviceFee'
import { formatPrice } from '@/lib/utils'
import type { ServiceFeePercent } from '@/types'

import { CARD_LOGO_METHOD_IDS, SIPAGO_CARD_LOGOS, paymentMethods } from './paymentMethods'

interface CheckoutViewProps {
  eventId: string
  catalogSlug?: string
  /** Switch global de plataforma: si es false, no se puede completar el pago. */
  paymentsEnabled?: boolean
  /** Métodos de pago realmente configurados para este evento (ej. ['mp', 'sipago']). */
  availablePaymentMethods?: string[]
  /** Costo de servicio (%) vigente según el backend; si falta se usan los valores por defecto. */
  serviceFeePercent?: ServiceFeePercent
}

export function CheckoutView({
  eventId,
  catalogSlug,
  paymentsEnabled = true,
  availablePaymentMethods = ['mp'],
  serviceFeePercent,
}: CheckoutViewProps) {
  const router = useRouter()
  const { items, total, clearCart } = useCart()
  // Al pagar se vacía el carrito antes de que termine la navegación. Conservamos
  // los ítems de este render para no mostrar "carrito vacío" en el medio.
  const keptItemsRef = useRef(items)
  if (items.length > 0) keptItemsRef.current = items
  const displayItems = items.length > 0 ? items : keptItemsRef.current
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')

  // Los tickets no se pueden pagar en efectivo (el backend también lo rechaza).
  const hasTickets = displayItems.some(i => i.kind === 'ticket')
  const allowedMethodIds = useMemo(
    () => availablePaymentMethods.filter(id => !(hasTickets && id === 'cash')),
    [availablePaymentMethods, hasTickets],
  )
  const cashBlocked = hasTickets && availablePaymentMethods.includes('cash')
  const enabledMethods = useMemo(
    () => paymentMethods.filter(m => allowedMethodIds.includes(m.id)),
    [allowedMethodIds],
  )
  const [paymentMethod, setPaymentMethod] = useState(() => availablePaymentMethods[0] ?? 'mp')

  useEffect(() => {
    if (!allowedMethodIds.includes(paymentMethod)) {
      setPaymentMethod(allowedMethodIds[0] ?? (cashBlocked ? '' : 'mp'))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allowedMethodIds])

  const [error, setError] = useState('')
  const [nameError, setNameError] = useState(false)
  const [emailError, setEmailError] = useState(false)
  const [focused, setFocused] = useState(false)
  const [emailFocused, setEmailFocused] = useState(false)
  const [loading, setLoading] = useState(false)

  // La orden se encola apenas hay ítems, con el medio de pago elegido, para que
  // el checkout del proveedor se arme mientras el comprador escribe sus datos.
  const pendingOrderIdRef = useRef<string | null>(null)
  const precreateRef = useRef<Promise<string | null> | null>(null)
  const [trackedOrderId, setTrackedOrderId] = useState<string | null>(null)
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null)

  const itemsKey = cartItemsKey(items)

  useEffect(() => {
    if (items.length === 0 || !paymentMethod || !paymentsEnabled) {
      precreateRef.current = null
      return
    }
    const slug = catalogSlug ?? eventId
    const existing = loadPendingOrder(slug, itemsKey, paymentMethod)
    if (existing) {
      pendingOrderIdRef.current = existing.orderId
      setTrackedOrderId(existing.orderId)
      precreateRef.current = Promise.resolve(existing.orderId)
      return
    }

    let cancelled = false
    const promise = (async (): Promise<string | null> => {
      try {
        const res = await fetch(catalogPaths.createOrder(slug), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Branded-Host': window.location.host,
          },
          body: JSON.stringify({
            customer_name: '',
            customer_email: '',
            payment_method: paymentMethod,
            items: items.map(orderLinePayload),
            idempotency_key: pendingIdempotencyKey(slug, itemsKey, paymentMethod),
          }),
        })
        if (!res.ok || cancelled) return null
        const data = await res.json()
        if (cancelled || !data.order_id) return null
        savePendingOrder({
          orderId: data.order_id,
          slug,
          itemsKey,
          createdAt: Date.now(),
          paymentMethod,
        })
        pendingOrderIdRef.current = data.order_id
        setTrackedOrderId(data.order_id)
        return data.order_id as string
      } catch {
        return null
      }
    })()
    precreateRef.current = promise
    return () => {
      cancelled = true
    }
  }, [items, itemsKey, paymentMethod, paymentsEnabled, catalogSlug, eventId])

  useEffect(() => {
    setCheckoutUrl(null)
  }, [paymentMethod])

  useEffect(() => {
    if (!trackedOrderId) return
    let cancelled = false
    let intervalId: ReturnType<typeof setInterval> | null = null
    const poll = async () => {
      try {
        const res = await fetch(catalogPaths.orderStatus(trackedOrderId), {
          headers: { 'X-Branded-Host': window.location.host },
        })
        if (!res.ok) return
        const data = await res.json()
        if (!cancelled && data.checkout_url) {
          setCheckoutUrl(data.checkout_url)
          if (intervalId) clearInterval(intervalId)
        }
      } catch {
        // la orden sigue en cola; el detalle de la orden retoma el polling
      }
    }
    poll()
    intervalId = setInterval(poll, 2000)
    return () => {
      cancelled = true
      if (intervalId) clearInterval(intervalId)
    }
  }, [trackedOrderId])

  const { serviceFee, total: grandTotal } = computeCartTotals(displayItems, serviceFeePercent)
  const listTotal = displayItems.reduce((s, i) => s + (i.listPrice ?? i.price) * i.quantity, 0)
  const hasDiscount = listTotal > total

  const handleConfirm = async () => {
    if (!paymentsEnabled) { setError('Compra inhabilitada. No es posible completar el pago en este momento.'); return }
    const trimmedName = name.trim()
    const trimmedEmail = email.trim()
    const emailMalformed = !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)
    // Ambos campos se marcan a la vez, aunque el mensaje respete la precedencia de siempre.
    setNameError(trimmedName === '')
    setEmailError(trimmedEmail === '' || emailMalformed)
    if (trimmedName === '') { setError('Ingresá tu nombre para continuar'); return }
    if (trimmedEmail === '') { setError('Ingresá tu email para continuar'); return }
    if (emailMalformed) { setError('Ingresá un email válido'); return }
    if (!paymentMethod) { setError('Seleccioná un método de pago'); return }
    if (displayItems.length === 0) return

    setLoading(true)
    setError('')
    // Se mantiene en true para cualquier redirect (MP externo o router.push
    // interno) para que el overlay no se apague antes de que la navegación
    // termine — si no, queda una ventana "trabada" sin loader visible.
    let isNavigatingAway = false

    try {
      const slug = catalogSlug ?? eventId
      const payItemsKey = cartItemsKey(displayItems)
      let orderId = loadPendingOrder(slug, payItemsKey, paymentMethod)?.orderId ?? null
      if (!orderId && precreateRef.current) {
        orderId = await precreateRef.current
        orderId = loadPendingOrder(slug, payItemsKey, paymentMethod)?.orderId ?? orderId
      }
      let orderNumber: number | null = null

      if (orderId) {
        // Orden ya encolada desde el carrito: solo adjuntamos los datos.
        // El PATCH además promueve la orden a la cola prioritaria del backend.
        const res = await fetch(catalogPaths.updateOrderCustomer(orderId), {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'X-Branded-Host': window.location.host,
          },
          body: JSON.stringify({
            customer_name: name.trim(),
            customer_email: email.trim(),
          }),
        })
        if (!res.ok && res.status !== 409) {
          if (res.status === 404) {
            // La orden pre-creada expiró o se perdió — caemos al flujo clásico
            clearPendingOrder()
            pendingOrderIdRef.current = null
            orderId = null
          } else {
            const body = await res.json().catch(() => ({}))
            setError(body.error ?? 'Error al confirmar tus datos. Intentá de nuevo.')
            return
          }
        }
      }

      if (!orderId) {
        const res = await fetch(catalogPaths.createOrder(slug), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Branded-Host': window.location.host,
          },
          body: JSON.stringify({
            customer_name: name.trim(),
            customer_email: email.trim(),
            payment_method: paymentMethod,
            items: displayItems.map(orderLinePayload),
          }),
        })

        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          setError(body.error ?? 'Error al crear la orden. Intentá de nuevo.')
          return
        }

        const data = await res.json()
        orderId = data.order_id as string
        orderNumber = data.order_number ?? null
      }

      clearCart()
      clearPendingOrder()
      saveOrder({
        orderId,
        orderNumber,
        slug,
        total: grandTotal,
        createdAt: new Date().toISOString(),
      })

      if (checkoutUrl) {
        // El link de MP ya está listo: vamos directo, sin pasar por el tracker
        isNavigatingAway = true
        window.location.assign(checkoutUrl)
        return
      }
      isNavigatingAway = true
      router.push(buyerFlowPath(eventId, { catalogSlug, path: `order/${orderId}` }))
    } catch {
      setError('Error de conexión. Verificá tu internet e intentá de nuevo.')
    } finally {
      // Dejamos el overlay prendido hasta que la navegación (externa o
      // interna) complete y este componente se desmonte.
      if (!isNavigatingAway) setLoading(false)
    }
  }

  return (
    <div
      className="flex min-h-dvh flex-col"
      style={{ background: BUYER_COLORS.bg, fontFamily: BUYER_FONT }}
    >

      {/* Loader overlay */}
      {loading && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4"
          style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' } as React.CSSProperties}
        >
          <div
            className="h-10 w-10 rounded-full border-[3px]"
            style={{
              borderColor: BUYER_COLORS.border,
              borderTopColor: BUYER_COLORS.text,
              animation: 'spin 0.75s linear infinite',
            }}
          />
          <p className="text-[14px] font-semibold" style={{ color: BUYER_COLORS.text }}>
            Procesando tu pedido...
          </p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
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
        <button
          type="button"
          onClick={() => router.push(buyerFlowPath(eventId, { catalogSlug, path: 'cart' }))}
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full transition-colors"
          style={{ background: BUYER_COLORS.subtleFill }}
          aria-label="Volver"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
            <path d="M11 4L6 9l5 5" stroke={BUYER_COLORS.text} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <span
          className="absolute left-1/2 -translate-x-1/2 text-[16px] font-bold tracking-tight"
          style={{ color: BUYER_COLORS.text, letterSpacing: '-0.02em' }}
        >
          Confirmar pedido
        </span>
      </div>

      {/* Contenido */}
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-4 px-4 py-5 pb-36">

        {!paymentsEnabled && (
          <div
            className="rounded-[14px] px-4 py-3 text-center text-[13px] font-semibold"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#DC2626' }}
          >
            Compra inhabilitada temporalmente. No es posible completar el pago en este momento.
          </div>
        )}

        {/* Tu pedido */}
        <p className="text-[18px] font-bold" style={{ color: BUYER_COLORS.text }}>Tu pedido</p>

        {displayItems.length === 0 ? (
          <p className="text-[14px]" style={{ color: BUYER_COLORS.muted }}>No tenés items en el carrito</p>
        ) : (
          <>
            <div className="flex flex-col gap-3">
              {displayItems.map(item => (
                <div
                  key={item.productId}
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
                      {item.name}
                    </span>
                  </div>
                  <span className="ml-3 flex-shrink-0 text-[14px] font-semibold" style={{ color: BUYER_COLORS.text }}>
                    {formatPrice(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            {/* Resumen de costos */}
            <div className="flex flex-col gap-2">
              {hasDiscount && (
                <div className="flex items-center justify-between">
                  <span className="text-[14px]" style={{ color: BUYER_COLORS.muted }}>Sin descuento</span>
                  <span className="text-[14px] line-through" style={{ color: BUYER_COLORS.muted }}>
                    {formatPrice(listTotal)}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-[14px]" style={{ color: BUYER_COLORS.muted }}>Cargo por servicio</span>
                <span className="text-[14px] font-semibold" style={{ color: '#22C55E' }}>Gratis</span>
              </div>
            </div>
          </>
        )}

        {/* Nombre */}
        <div>
          <label
            htmlFor="checkout-name"
            className="mb-3 block text-[18px] font-bold"
            style={{ color: BUYER_COLORS.text }}
          >
            Tu nombre
          </label>
          <input
            id="checkout-name"
            type="text"
            value={name}
            onChange={e => { setName(e.target.value); setNameError(false); if (error) setError('') }}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Ej: Juan Pérez"
            aria-invalid={nameError}
            // text-[16px]: por debajo de 16px, iOS/Android hacen zoom automático al enfocar el input
            className="w-full rounded-[12px] px-4 py-3 text-[16px] outline-none transition-colors"
            style={{
              border: `1.5px solid ${nameError ? '#DC2626' : focused ? BUYER_COLORS.text : BUYER_COLORS.border}`,
              background: '#fff',
              color: BUYER_COLORS.text,
              fontFamily: BUYER_FONT,
            }}
          />
        </div>

        {/* Email */}
        <div>
          <label
            htmlFor="checkout-email"
            className="mb-3 block text-[18px] font-bold"
            style={{ color: BUYER_COLORS.text }}
          >
            Tu email
          </label>
          <input
            id="checkout-email"
            type="email"
            inputMode="email"
            value={email}
            onChange={e => { setEmail(e.target.value); setEmailError(false); if (error) setError('') }}
            onFocus={() => setEmailFocused(true)}
            onBlur={() => setEmailFocused(false)}
            placeholder="Ej: juan@email.com"
            aria-invalid={emailError}
            className="w-full rounded-[12px] px-4 py-3 text-[16px] outline-none transition-colors"
            style={{
              border: `1.5px solid ${emailError ? '#DC2626' : emailFocused ? BUYER_COLORS.text : BUYER_COLORS.border}`,
              background: '#fff',
              color: BUYER_COLORS.text,
              fontFamily: BUYER_FONT,
            }}
          />
        </div>

        {/* Método de pago */}
        <div>
          <p className="mb-3 text-[18px] font-bold" style={{ color: BUYER_COLORS.text }}>
            Método de pago
          </p>
          <div className="grid gap-2" style={{ gridAutoRows: '1fr' }}>
            {cashBlocked && (
              <p className="text-[13px]" style={{ color: BUYER_COLORS.muted }}>
                Los tickets no se pueden pagar en efectivo.
              </p>
            )}
            {enabledMethods.map(method => {
              const selected = paymentMethod === method.id
              return (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => { setPaymentMethod(method.id); if (error) setError('') }}
                  className="flex w-full items-center gap-4 rounded-[18px] px-4 py-4 text-left transition-all"
                  style={{
                    border: selected ? '2px solid rgba(0,0,0,0.25)' : `1.5px solid ${BUYER_COLORS.border}`,
                    background: '#fff',
                    fontFamily: BUYER_FONT,
                  }}
                >
                  <span className="flex h-10 w-12 flex-shrink-0 items-center justify-center rounded-[12px]"
                    style={{ background: BUYER_COLORS.subtleFill }}
                  >
                    {method.icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-bold tracking-tight" style={{ color: BUYER_COLORS.text }}>
                      {method.label}
                    </p>
                    {method.sub && (
                      <p className="mt-0.5 text-[13px]" style={{ color: BUYER_COLORS.muted }}>
                        {method.sub}
                      </p>
                    )}
                    {CARD_LOGO_METHOD_IDS.includes(method.id) && (
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1.5">
                        {SIPAGO_CARD_LOGOS.map(logo => (
                          <Image
                            key={logo.src}
                            src={logo.src}
                            alt={logo.alt}
                            width={32}
                            height={20}
                            unoptimized
                            className="h-5 w-8 object-contain"
                          />
                        ))}
                        <span
                          className="flex h-5 items-center text-[12px] font-medium"
                          style={{ color: BUYER_COLORS.muted }}
                        >
                          y más
                        </span>
                      </div>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div
            className="rounded-[12px] px-4 py-3 text-[13px]"
            style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', color: '#DC2626' }}
          >
            {error}
          </div>
        )}

      </div>

      {/* Bottom bar */}
      <div
        className="fixed bottom-0 left-0 right-0 z-20 border-t px-5 py-4"
        style={{
          background: BUYER_COLORS.bg,
          borderColor: BUYER_COLORS.border,
          paddingBottom: 'max(16px, env(safe-area-inset-bottom, 16px))',
        }}
      >
        <div className="mx-auto max-w-lg">
          {serviceFee > 0 && (
            <div className="mb-2 flex items-center justify-between text-[14px]" style={{ color: BUYER_COLORS.muted }}>
              <span>Costo de servicio</span>
              <span className="font-semibold">{formatPrice(serviceFee)}</span>
            </div>
          )}
          <div className="mb-3 flex items-end justify-between">
            <span className="text-[22px] font-semibold" style={{ color: '#000000' }}>Total</span>
            <div className="flex flex-col items-end">
              {hasDiscount && (
                <div className="flex items-center gap-2">
                  <span
                    className="flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[12px] font-semibold"
                    style={{ background: '#CAFF00', color: '#000000' }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <path d="M5.8 11.3 2 22l10.7-3.79"/>
                      <path d="M4 3h.01"/><path d="M22 8h.01"/>
                      <path d="M15 2h.01"/><path d="M22 20h.01"/>
                      <path d="m22 2-2.24.75a2.9 2.9 0 0 0-1.96 3.12c.1.86-.57 1.63-1.45 1.63h-.38c-.86 0-1.6.6-1.76 1.44L14 10"/>
                      <path d="m22 13-.82-.33c-.86-.34-1.82.2-1.98 1.11c-.11.7-.72 1.22-1.43 1.22H17"/>
                      <path d="m11 2 .33.82c.34.86-.2 1.82-1.11 1.98C9.52 4.9 9 5.52 9 6.23V7"/>
                      <path d="M11 13c1.93 1.93 2.83 4.17 2 5-.83.83-3.07-.07-5-2-1.93-1.93-2.83-4.17-2-5 .83-.83 3.07.07 5 2Z"/>
                    </svg>
                    Ahorrás {formatPrice(listTotal - total)}
                  </span>
                  <span className="text-[14px] font-medium line-through" style={{ color: BUYER_COLORS.muted }}>
                    {formatPrice(listTotal)}
                  </span>
                </div>
              )}
              <span className="text-[22px] font-semibold tracking-tight" style={{ color: BUYER_COLORS.text, letterSpacing: '-0.03em' }}>
                {formatPrice(grandTotal)}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={displayItems.length === 0 || loading || !paymentsEnabled}
            className="flex h-[54px] w-full items-center justify-center rounded-full text-[17px] font-semibold tracking-tight transition-opacity active:opacity-85 disabled:opacity-40"
            style={{
              background: BUYER_COLORS.accent,
              color: BUYER_COLORS.accentText,
              fontFamily: BUYER_FONT,
            }}
          >
            {!paymentsEnabled
              ? 'Compra inhabilitada'
              : loading
              ? 'Procesando...'
              : displayItems.length > 0
              ? 'Pagar'
              : 'Carrito vacío'}
          </button>
        </div>
      </div>

    </div>
  )
}
