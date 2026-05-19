'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCart } from '@/lib/hooks/useCart'
import { saveOrder } from '@/lib/hooks/useOrderHistory'
import { formatPrice } from '@/lib/utils'
import { buyerFlowPath } from '@/lib/buyerRoutes'
import { BUYER_COLORS } from '@/lib/buyerUi'

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
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <circle cx="11" cy="11" r="11" fill="#009EE3"/>
        <rect x="5" y="7.5" width="12" height="7.5" rx="1.5" stroke="#fff" strokeWidth="1.25"/>
        <path d="M5 10.5h12" stroke="#fff" strokeWidth="1.25"/>
        <rect x="7" y="12.5" width="3" height="1.25" rx="0.5" fill="#fff"/>
      </svg>
    ),
    color: '#009EE3',
  },
  // {
  //   id: 'cash',
  //   label: 'Efectivo',
  //   sub: 'Pagás en el punto de retiro',
  //   icon: (
  //     <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
  //       <circle cx="11" cy="11" r="11" fill="#22C55E"/>
  //       <rect x="5" y="8" width="12" height="7" rx="1.5" stroke="#fff" strokeWidth="1.5"/>
  //       <circle cx="11" cy="11.5" r="1.5" stroke="#fff" strokeWidth="1.25"/>
  //     </svg>
  //   ),
  //   color: '#22C55E',
  // },
  // {
  //   id: 'transfer',
  //   label: 'Transferencia',
  //   sub: 'CVU / alias bancario',
  //   icon: (
  //     <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
  //       <circle cx="11" cy="11" r="11" fill="#8B5CF6"/>
  //       <path d="M7 11h8M12 8.5l2.5 2.5-2.5 2.5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  //     </svg>
  //   ),
  //   color: '#8B5CF6',
  // },
]

export function CheckoutView({ eventId, catalogSlug }: CheckoutViewProps) {
  const router = useRouter()
  const { items, total, clearCart } = useCart()
  const [name, setName] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('mp')
  const [error, setError] = useState('')
  const [focused, setFocused] = useState(false)
  const [loading, setLoading] = useState(false)

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

  const font = "var(--font-dm-sans, 'DM Sans', sans-serif)"

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100svh', background: '#F7F7FA', fontFamily: font }}>

      {/* Loader overlay */}
      {loading && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 50,
          background: 'rgba(247,247,250,0.92)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: '16px',
        }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '50%',
            border: '3px solid #E5E7EB',
            borderTopColor: '#0A0A0F',
            animation: 'spin 0.75s linear infinite',
          }} />
          <p style={{ fontSize: '14px', fontWeight: 600, color: '#0A0A0F', margin: 0 }}>
            Procesando tu pedido...
          </p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* Top bar */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(0,0,0,0.06)',
        display: 'flex', alignItems: 'center',
        padding: '0 16px', height: '60px',
      }}>
        <button
          onClick={() => router.push(buyerFlowPath(eventId, { catalogSlug, path: 'cart' }))}
          style={{
            width: '36px', height: '36px', borderRadius: '50%',
            background: '#F4F4F6', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M11 4L6 9l5 5" stroke="#0A0A0F" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <span style={{
          position: 'absolute', left: '50%', transform: 'translateX(-50%)',
          fontSize: '16px', fontWeight: 700, color: '#0A0A0F', letterSpacing: '-0.02em',
        }}>
          Confirmar pedido
        </span>
      </div>

      <div style={{ flex: 1, padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '480px', width: '100%', margin: '0 auto' }}>

        {/* Order summary */}
        <div style={{ background: '#FFFFFF', borderRadius: '18px', border: '1px solid rgba(0,0,0,0.07)', overflow: 'hidden' }}>
          <div style={{ padding: '16px 16px 0' }}>
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#9A9AA8' }}>
              Resumen del pedido
            </span>
          </div>

          {items.length === 0 ? (
            <div style={{ padding: '20px 16px', fontSize: '13px', color: '#9A9AA8' }}>
              No tenés items en el carrito
            </div>
          ) : (
            <>
              <div style={{ padding: '10px 0 0' }}>
                {items.map((item, idx) => (
                  <div key={item.productId} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 16px',
                    borderBottom: idx < items.length - 1 ? '1px solid #F4F4F6' : 'none',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{
                        width: '22px', height: '22px', borderRadius: '8px',
                        background: '#F4F4F6',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '11px', fontWeight: 800, color: '#0A0A0F', flexShrink: 0,
                      }}>
                        {item.quantity}
                      </span>
                      <span style={{ fontSize: '13px', color: '#0A0A0F', fontWeight: 500 }}>{item.name}</span>
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#0A0A0F', letterSpacing: '-0.02em' }}>
                      {formatPrice(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              <div style={{ padding: '12px 16px', borderTop: '1px solid #F4F4F6', background: '#FAFAFA' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '12px', color: '#9A9AA8' }}>Cargo por servicio</span>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#16A34A' }}>Gratis</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: '#0A0A0F' }}>Total</span>
                  <span style={{ fontSize: '20px', fontWeight: 800, color: '#0A0A0F', letterSpacing: '-0.04em' }}>
                    {formatPrice(total)}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Name input */}
        <div style={{ background: '#FFFFFF', borderRadius: '18px', border: '1px solid rgba(0,0,0,0.07)', padding: '16px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#9A9AA8', marginBottom: '10px' }}>
            Tu nombre
          </label>
          <input
            type="text"
            value={name}
            onChange={e => { setName(e.target.value); if (error) setError('') }}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Ej: Juan Pérez"
            style={{
              width: '100%',
              borderRadius: '12px',
              border: `1.5px solid ${focused ? '#0A0A0F' : 'rgba(0,0,0,0.1)'}`,
              padding: '12px 14px',
              fontSize: '15px',
              color: '#0A0A0F',
              background: '#FAFAFA',
              outline: 'none',
              boxSizing: 'border-box',
              transition: 'border-color 0.15s',
              fontFamily: font,
            }}
          />
        </div>

        {/* Payment method */}
        <div style={{ background: '#FFFFFF', borderRadius: '18px', border: '1px solid rgba(0,0,0,0.07)', padding: '16px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#9A9AA8', marginBottom: '10px' }}>
            Método de pago
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {paymentMethods.map(method => {
              const selected = paymentMethod === method.id
              return (
                <button
                  key={method.id}
                  onClick={() => { setPaymentMethod(method.id); if (error) setError('') }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    width: '100%', textAlign: 'left',
                    borderRadius: '14px',
                    border: selected ? `2px solid ${method.color}` : '1.5px solid rgba(0,0,0,0.08)',
                    padding: selected ? '11px 13px' : '11.5px 13.5px',
                    background: selected ? `${method.color}0D` : '#FAFAFA',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    fontFamily: font,
                  }}
                >
                  <span style={{ flexShrink: 0 }}>{method.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#0A0A0F', letterSpacing: '-0.01em' }}>
                      {method.label}
                    </p>
                    <p style={{ margin: '1px 0 0', fontSize: '11px', color: '#9A9AA8' }}>
                      {method.sub}
                    </p>
                  </div>
                  <span style={{
                    width: '18px', height: '18px', borderRadius: '50%', flexShrink: 0,
                    border: selected ? `5px solid ${method.color}` : '2px solid rgba(0,0,0,0.15)',
                    background: '#fff',
                    transition: 'all 0.15s',
                    boxSizing: 'border-box',
                  }} />
                </button>
              )
            })}
          </div>
        </div>

        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.06)',
            border: '1px solid rgba(239,68,68,0.15)',
            borderRadius: '12px',
            padding: '10px 14px',
            fontSize: '13px',
            color: '#DC2626',
          }}>
            {error}
          </div>
        )}

        {/* CTA */}
        <div style={{ marginTop: 'auto', paddingBottom: '8px' }}>
          <button
            onClick={handleConfirm}
            disabled={items.length === 0 || loading}
            style={{
              width: '100%',
              borderRadius: '100px',
              background: items.length === 0 || loading ? '#E5E7EB' : BUYER_COLORS.accent,
              color: items.length === 0 || loading ? '#9CA3AF' : BUYER_COLORS.accentText,
              border: 'none',
              padding: '16px',
              fontSize: '16px',
              fontWeight: 800,
              letterSpacing: '-0.02em',
              cursor: items.length === 0 || loading ? 'not-allowed' : 'pointer',
              transition: 'opacity 0.15s',
              fontFamily: font,
            }}
            onMouseEnter={e => { if (items.length > 0 && !loading) (e.currentTarget as HTMLButtonElement).style.opacity = '0.88' }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1' }}
          >
            {loading ? 'Procesando...' : items.length > 0 ? `Pagar ${formatPrice(total)}` : 'Carrito vacío'}
          </button>
        </div>

      </div>
    </div>
  )
}
