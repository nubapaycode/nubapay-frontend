'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

import { catalogPaths } from '@/lib/api/paths'
import { buyerFlowPath } from '@/lib/buyerRoutes'
import { BUYER_COLORS, BUYER_FONT } from '@/lib/buyerUi'
import { useCart } from '@/lib/hooks/useCart'
import { saveOrder } from '@/lib/hooks/useOrderHistory'
import { formatPrice } from '@/lib/utils'

interface CheckoutViewProps {
  eventId: string
  catalogSlug?: string
}

const paymentMethods = [
  {
    id: 'mp',
    label: 'Mercado Pago',
    sub: 'Débito, crédito o dinero en cuenta',
    icon: (
      <svg width="38" height="26" viewBox="206 130 288 210" fill="none">
        <path fill="#00bcff" d="m350.04,138.92c-77.83,0-140.91,40.36-140.91,90.15s63.09,94.05,140.91,94.05,140.91-44.27,140.91-94.05-63.09-90.15-140.91-90.15Z"/>
        <path fill="#fff" d="m304.18,201.2c-.07.14-1.45,1.56-.55,2.71,2.18,2.78,8.91,4.38,15.72,2.85,4.05-.91,9.25-5.04,14.28-9.03,5.45-4.33,10.86-8.67,16.3-10.39,5.76-1.83,9.45-1.05,11.89-.31,2.67.8,5.82,2.56,10.84,6.32,9.45,7.1,47.43,40.26,54,45.99,5.28-2.39,30.47-12.56,62.39-19.6-2.78-17.02-13.01-33.25-28.72-45.99-21.89,9.19-50.42,14.7-76.58,1.93-.13-.05-14.29-6.75-28.25-6.42-20.75.48-29.74,9.46-39.25,18.97l-12.05,12.99Z"/>
        <path fill="#fff" d="m425.1,242.95c-.45-.4-44.67-39.09-54.69-46.62-5.8-4.35-9.02-5.46-12.41-5.89-1.76-.23-4.2.1-5.9.57-4.66,1.27-10.75,5.34-16.16,9.63-5.6,4.46-10.88,8.66-15.79,9.76-6.26,1.4-13.91-.25-17.4-2.61-1.41-.95-2.41-2.05-2.89-3.16-1.29-2.99,1.09-5.38,1.48-5.78l12.2-13.2c1.42-1.41,2.85-2.83,4.31-4.23-3.94.51-7.58,1.52-11.12,2.5-4.42,1.24-8.68,2.42-12.98,2.42-1.8,0-11.42-1.58-13.25-2.07-11.05-3.02-23.56-5.97-38.04-12.73-17.35,12.91-28.65,28.77-32,46.56,2.49.66,9.02,2.15,10.71,2.52,39.26,8.73,51.49,17.72,53.71,19.6,2.4-2.67,5.87-4.36,9.73-4.36,4.35,0,8.26,2.19,10.64,5.56,2.25-1.78,5.35-3.3,9.36-3.29,1.82,0,3.71.34,5.62.98,4.43,1.52,6.72,4.47,7.9,7.14,1.48-.67,3.31-1.17,5.46-1.16,2.12,0,4.32.48,6.53,1.44,7.24,3.11,8.36,10.22,7.71,15.58.52-.06,1.04-.08,1.56-.08,8.58,0,15.56,6.98,15.56,15.57,0,2.66-.68,5.16-1.86,7.35,2.34,1.31,8.29,4.28,13.52,3.62,4.17-.53,5.76-1.95,6.32-2.76.39-.55.8-1.2.42-1.66l-11.08-12.3s-1.82-1.73-1.22-2.39c.62-.68,1.75.3,2.55.96,5.64,4.71,12.52,11.81,12.52,11.81.12.08.57.98,3.12,1.43,2.19.39,6.07.17,8.76-2.04.67-.56,1.35-1.25,1.93-1.97-.05.04-.09.08-.13.1,2.84-3.63-.32-7.29-.32-7.29l-12.93-14.52s-1.85-1.71-1.22-2.4c.56-.6,1.75.3,2.56.98,4.09,3.42,9.88,9.23,15.42,14.66,1.09.79,5.96,3.8,12.41-.43,3.92-2.57,4.7-5.73,4.59-8.1-.27-3.15-2.73-5.4-2.73-5.4l-17.66-17.76s-1.87-1.59-1.21-2.4c.54-.68,1.75.3,2.55.96,5.62,4.71,20.86,18.68,20.86,18.68.22.15,5.48,3.9,11.99-.24,2.33-1.49,3.81-3.73,3.94-6.34.22-4.52-2.96-7.2-2.96-7.2Z"/>
        <path fill="#fff" d="m339.41,265.46c-2.74-.03-5.74,1.6-6.13,1.36-.22-.14.17-1.24.42-1.88.27-.63,3.87-11.48-4.92-15.25-6.73-2.89-10.85.36-12.26,1.83-.37.38-.54.35-.58-.13-.14-1.96-1.01-7.24-6.82-9.02-8.3-2.54-13.64,3.25-14.99,5.35-.61-4.73-4.61-8.4-9.5-8.41-5.32,0-9.64,4.3-9.65,9.63,0,5.32,4.31,9.64,9.64,9.64,2.59,0,4.93-1.03,6.66-2.69.06.05.08.14.05.32-.41,2.39-1.15,11.04,7.92,14.57,3.64,1.41,6.73.36,9.29-1.43.76-.54.89-.31.78.41-.33,2.23.09,6.99,6.77,9.7,5.08,2.07,8.09-.04,10.07-1.87.86-.78,1.09-.65,1.14.56.24,6.44,5.59,11.56,12.09,11.57,6.7,0,12.13-5.41,12.13-12.1,0-6.7-5.42-12.06-12.12-12.13Z"/>
        <path fill="#0a0080" d="m350.01,135.19c-79.31,0-143.6,42.18-143.6,93.92,0,1.34-.02,5.03-.02,5.5,0,54.9,56.19,99.35,143.6,99.35s143.61-44.45,143.61-99.34v-5.51c0-51.74-64.29-93.92-143.59-93.92Zm137.12,83.51c-31.21,6.94-54.49,17.01-60.32,19.61-13.62-11.89-45.1-39.26-53.63-45.66-4.87-3.67-8.2-5.6-11.12-6.47-1.31-.4-3.12-.85-5.45-.85-2.17,0-4.5.39-6.93,1.17-5.51,1.75-11,6.11-16.31,10.33l-.27.22c-4.95,3.93-10.06,8-13.93,8.86-1.69.38-3.43.58-5.16.58-4.34,0-8.23-1.26-9.69-3.12-.24-.31-.08-.81.48-1.52l.07-.1,11.99-12.91c9.39-9.39,18.25-18.25,38.66-18.72.34-.01.68-.02,1.02-.02,12.7.01,25.4,5.69,26.83,6.36,11.91,5.81,24.21,8.76,36.56,8.77,12.85,0,26.11-3.17,40.05-9.58,14.56,12.24,24.21,26.99,27.15,43.06Zm-137.1-77.97c42.1,0,79.76,12.07,105.09,31.07-12.24,5.3-23.91,7.97-35.17,7.97-11.52-.01-23.03-2.78-34.21-8.23-.59-.28-14.61-6.89-29.2-6.9-.38,0-.77,0-1.15.01-17.14.4-26.8,6.49-33.29,11.82-6.31.16-11.76,1.68-16.61,3.03-4.33,1.2-8.06,2.24-11.7,2.24-1.5,0-4.2-.14-4.44-.15-4.18-.13-25.18-5.28-41.95-11.61,25.27-17.96,61.89-29.26,102.64-29.26Zm-107.61,33.01c17.51,7.16,38.76,12.7,45.48,13.13,1.87.12,3.87.34,5.87.34,4.46,0,8.91-1.25,13.21-2.45,2.54-.71,5.35-1.49,8.3-2.05-.79.77-1.58,1.56-2.37,2.35l-12.17,13.17c-.96.97-3.04,3.55-1.67,6.73.54,1.28,1.65,2.51,3.2,3.55,2.9,1.95,8.1,3.28,12.92,3.28,1.83,0,3.57-.18,5.15-.54,5.11-1.14,10.46-5.41,16.13-9.92,4.52-3.59,10.94-8.15,15.86-9.49,1.38-.37,3.06-.61,4.42-.61.41,0,.79.02,1.14.07,3.24.41,6.38,1.51,11.99,5.72,10,7.51,54.22,46.2,54.65,46.58.03.02,2.85,2.46,2.65,6.5-.11,2.26-1.36,4.26-3.54,5.65-1.89,1.2-3.83,1.81-5.8,1.81-2.96,0-4.99-1.39-5.13-1.48-.16-.13-15.31-14.03-20.89-18.7-.89-.74-1.75-1.4-2.62-1.4-.47,0-.88.2-1.16.55-.88,1.08.1,2.58,1.26,3.56l17.7,17.8s2.21,2.06,2.45,4.79c.14,2.95-1.27,5.42-4.2,7.34-2.09,1.38-4.2,2.07-6.27,2.07-2.72,0-4.63-1.24-5.05-1.53l-2.54-2.5c-4.64-4.57-9.43-9.29-12.94-12.21-.86-.71-1.77-1.37-2.64-1.37-.43,0-.82.16-1.12.48-.4.44-.68,1.24.32,2.57.4.55.89,1,.89,1l12.91,14.51c.1.13,2.66,3.17.29,6.19l-.46.58c-.39.42-.8.82-1.2,1.16-2.2,1.81-5.14,2-6.31,2-.63,0-1.22-.05-1.75-.15-1.27-.23-2.13-.58-2.55-1.07l-.16-.16c-.7-.73-7.21-7.38-12.6-11.87-.71-.6-1.6-1.34-2.51-1.34-.45,0-.85.18-1.17.52-1.06,1.17.54,2.91,1.22,3.55l11.01,12.15c-.01.11-.15.36-.41.74-.4.55-1.73,1.88-5.73,2.38-.48.06-.98.09-1.46.09-4.12,0-8.52-2-10.79-3.2,1.03-2.18,1.57-4.58,1.57-6.98,0-9.07-7.36-16.44-16.43-16.45-.19,0-.4,0-.59.01.29-4.14-.29-11.98-8.34-15.43-2.32-1-4.63-1.52-6.87-1.52-1.76,0-3.45.3-5.04.91-1.67-3.24-4.44-5.6-8.04-6.83-2-.69-3.98-1.04-5.9-1.04-3.35,0-6.44.99-9.19,2.94-2.64-3.28-6.62-5.22-10.81-5.22-3.67,0-7.2,1.47-9.81,4.06-3.43-2.62-17.03-11.26-53.44-19.53-1.74-.39-5.69-1.52-8.17-2.25,3.41-16.34,13.8-31.27,29.2-43.52Zm67.54,94.78l-.39-.35h-.4c-.32,0-.66.13-1.11.45-1.86,1.31-3.63,1.94-5.44,1.94-1,0-2.02-.2-3.04-.59-8.44-3.29-7.78-11.25-7.36-13.65.06-.49-.06-.86-.37-1.12l-.6-.49-.56.53c-1.65,1.59-3.8,2.45-6.06,2.45-4.83,0-8.77-3.93-8.76-8.77,0-4.83,3.94-8.76,8.78-8.75,4.37,0,8.09,3.28,8.64,7.65l.3,2.35,1.29-1.99c.14-.23,3.69-5.59,10.2-5.58,1.24,0,2.52.2,3.81.6,5.19,1.58,6.07,6.29,6.2,8.25.09,1.14.91,1.2,1.06,1.2.45,0,.78-.28,1.01-.53.98-1.02,3.11-2.72,6.45-2.72,1.53,0,3.15.37,4.83,1.09,8.25,3.54,4.51,14.02,4.47,14.13-.71,1.74-.74,2.5-.07,2.95l.32.15h.24c.37,0,.83-.16,1.6-.42,1.12-.39,2.81-.97,4.4-.97h0c6.21.07,11.26,5.13,11.26,11.26,0,6.2-5.06,11.24-11.27,11.24-6.07,0-11.01-4.73-11.23-10.74-.02-.52-.07-1.88-1.23-1.88-.47,0-.89.29-1.36.72-1.34,1.24-3.04,2.49-5.52,2.49-1.13,0-2.35-.26-3.64-.79-6.41-2.6-6.5-7-6.24-8.77.07-.47.09-.96-.23-1.35Zm40.07,48.88c-76.26,0-138.08-39.55-138.08-88.33,0-1.96.14-3.91.33-5.84.61.15,6.67,1.59,7.92,1.88,37.19,8.26,49.48,16.85,51.56,18.48-.7,1.69-1.07,3.51-1.07,5.35,0,7.69,6.25,13.95,13.93,13.95.86,0,1.72-.08,2.56-.24,1.16,5.66,4.86,9.95,10.51,12.15,1.65.63,3.32.96,4.97.96,1.06,0,2.13-.13,3.17-.39,1.05,2.65,3.39,5.96,8.65,8.09,1.84.74,3.68,1.13,5.47,1.13,1.46,0,2.89-.26,4.25-.76,2.52,6.13,8.51,10.2,15.19,10.2,4.43,0,8.68-1.8,11.78-4.99,2.65,1.48,8.25,4.15,13.91,4.16.73,0,1.41-.05,2.11-.13,5.62-.71,8.23-2.91,9.43-4.62.22-.3.41-.62.58-.95,1.32.38,2.78.69,4.46.7,3.07,0,6.01-1.05,8.99-3.21,2.93-2.11,5.01-5.14,5.31-7.72,0-.03,0-.07.01-.11.99.2,2,.3,3.01.3,3.16,0,6.27-.98,9.24-2.93,5.73-3.75,6.72-8.66,6.63-11.87,1.01.21,2.03.32,3.05.32,2.96,0,5.88-.89,8.65-2.66,3.55-2.27,5.69-5.75,6.02-9.79.21-2.75-.47-5.53-1.91-7.91,9.58-4.13,31.48-12.12,57.27-17.93.11,1.46.17,2.93.17,4.41,0,48.78-61.82,88.33-138.07,88.33Z"/>
      </svg>
    ),
    color: '#009EE3',
  },
]

export function CheckoutView({ eventId, catalogSlug }: CheckoutViewProps) {
  const router = useRouter()
  const { items, total, clearCart } = useCart()
  const [name, setName] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('mp')

  useEffect(() => {
    const saved = localStorage.getItem('nubapay_buyer_name')
    if (saved) setName(saved)
  }, [])
  const [error, setError] = useState('')
  const [focused, setFocused] = useState(false)
  const [loading, setLoading] = useState(false)

  const listTotal = items.reduce((s, i) => s + (i.listPrice ?? i.price) * i.quantity, 0)
  const hasDiscount = listTotal > total

  const handleConfirm = async () => {
    if (name.trim() === '') { setError('Ingresá tu nombre para continuar'); return }
    if (!paymentMethod) { setError('Seleccioná un método de pago'); return }
    if (items.length === 0) return

    setLoading(true)
    setError('')

    try {
      const slug = catalogSlug ?? eventId
      const res = await fetch(catalogPaths.createOrder(slug), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Branded-Host': window.location.host,
        },
        body: JSON.stringify({
          customer_name: name.trim(),
          payment_method: paymentMethod,
          items: items.map(it => ({ product_id: it.productId, quantity: it.quantity })),
        }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setError(body.error ?? 'Error al crear la orden. Intentá de nuevo.')
        return
      }

      const data = await res.json()
      localStorage.setItem('nubapay_buyer_name', name.trim())
      clearCart()
      saveOrder({
        orderId: data.order_id,
        orderNumber: data.order_number ?? null,
        slug: catalogSlug ?? eventId,
        total,
        createdAt: new Date().toISOString(),
      })
      router.push(buyerFlowPath(eventId, { catalogSlug, path: `order/${data.order_id}` }))
    } catch {
      setError('Error de conexión. Verificá tu internet e intentá de nuevo.')
    } finally {
      setLoading(false)
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

        {/* Tu pedido */}
        <p className="text-[18px] font-bold" style={{ color: BUYER_COLORS.text }}>Tu pedido</p>

        {items.length === 0 ? (
          <p className="text-[14px]" style={{ color: BUYER_COLORS.muted }}>No tenés items en el carrito</p>
        ) : (
          <>
            <div className="flex flex-col gap-3">
              {items.map(item => (
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
            onChange={e => { setName(e.target.value); if (error) setError('') }}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Ej: Juan Pérez"
            className="w-full rounded-[12px] px-4 py-3 text-[15px] outline-none transition-colors"
            style={{
              border: `1.5px solid ${focused ? BUYER_COLORS.text : BUYER_COLORS.border}`,
              background: BUYER_COLORS.subtleFill,
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
          <div className="flex flex-col gap-2">
            {paymentMethods.map(method => {
              const selected = paymentMethod === method.id
              return (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => { setPaymentMethod(method.id); if (error) setError('') }}
                  className="flex w-full items-center gap-4 rounded-[18px] px-4 py-4 text-left transition-all"
                  style={{
                    border: selected ? `2px solid ${method.color}` : `1.5px solid ${BUYER_COLORS.border}`,
                    background: selected ? `${method.color}0E` : '#fff',
                    fontFamily: BUYER_FONT,
                  }}
                >
                  <span className="flex h-10 w-12 flex-shrink-0 items-center justify-center rounded-[12px]"
                    style={{ background: selected ? `${method.color}18` : BUYER_COLORS.subtleFill }}
                  >
                    {method.icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-bold tracking-tight" style={{ color: BUYER_COLORS.text }}>
                      {method.label}
                    </p>
                    <p className="mt-0.5 text-[13px]" style={{ color: BUYER_COLORS.muted }}>
                      {method.sub}
                    </p>
                  </div>
                  {selected ? (
                    <span
                      className="flex-shrink-0 rounded-full"
                      style={{
                        width: '22px',
                        height: '22px',
                        border: `2px solid ${method.color}`,
                        background: '#fff',
                        boxSizing: 'border-box' as const,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <span
                        className="rounded-full"
                        style={{
                          width: '12px',
                          height: '12px',
                          background: method.color,
                          display: 'block',
                        }}
                      />
                    </span>
                  ) : (
                    <span
                      className="flex-shrink-0 rounded-full"
                      style={{
                        width: '22px',
                        height: '22px',
                        border: `2px solid ${BUYER_COLORS.border}`,
                        background: '#fff',
                        boxSizing: 'border-box' as const,
                        display: 'inline-block',
                      }}
                    />
                  )}
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
                {formatPrice(total)}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={items.length === 0 || loading}
            className="flex h-[54px] w-full items-center justify-center rounded-full text-[17px] font-semibold tracking-tight transition-opacity active:opacity-85 disabled:opacity-40"
            style={{
              background: BUYER_COLORS.accent,
              color: BUYER_COLORS.accentText,
              fontFamily: BUYER_FONT,
            }}
          >
            {loading ? 'Procesando...' : items.length > 0 ? 'Pagar' : 'Carrito vacío'}
          </button>
        </div>
      </div>

    </div>
  )
}
