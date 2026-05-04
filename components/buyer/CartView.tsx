'use client'

import { useRouter } from 'next/navigation'
import { useCart } from '@/lib/hooks/useCart'
import { CartItemRow } from './CartItemRow'
import { formatPrice } from '@/lib/utils'

interface CartViewProps {
  eventId: string
}

export function CartView({ eventId }: CartViewProps) {
  const router = useRouter()
  const { items, updateQuantity, total } = useCart()
  const font = "var(--font-dm-sans, 'DM Sans', sans-serif)"

  if (items.length === 0) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        minHeight: '70vh', gap: '16px', textAlign: 'center', padding: '24px',
        fontFamily: font,
      }}>
        <div style={{
          width: '72px', height: '72px', borderRadius: '24px',
          background: '#F4F4F6',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <path d="M4 4h3l4 16h14l3-10H8" stroke="#C4C4CF" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="13" cy="26" r="1.5" fill="#C4C4CF"/>
            <circle cx="23" cy="26" r="1.5" fill="#C4C4CF"/>
          </svg>
        </div>
        <div>
          <p style={{ fontSize: '17px', fontWeight: 700, color: '#0A0A0F', margin: '0 0 6px', letterSpacing: '-0.02em' }}>
            Tu carrito está vacío
          </p>
          <p style={{ fontSize: '14px', color: '#9A9AA8', margin: 0 }}>
            Agregá productos para continuar
          </p>
        </div>
        <button
          onClick={() => router.push(`/${eventId}`)}
          style={{
            background: '#F4F4F6', border: 'none', borderRadius: '100px',
            padding: '10px 20px', fontSize: '14px', fontWeight: 600,
            color: '#0A0A0F', cursor: 'pointer', fontFamily: font,
          }}
        >
          ← Volver al catálogo
        </button>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100svh', background: '#F7F7FA', fontFamily: font }}>

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
          onClick={() => router.push(`/${eventId}`)}
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
          Tu carrito
        </span>
        <span style={{
          marginLeft: 'auto',
          fontSize: '12px', fontWeight: 700,
          background: '#C6FF00', color: '#0A0F00',
          borderRadius: '100px', padding: '3px 10px',
        }}>
          {items.reduce((s, i) => s + i.quantity, 0)} items
        </span>
      </div>

      <div style={{ flex: 1, padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '480px', width: '100%', margin: '0 auto' }}>

        {/* Items */}
        <div style={{ background: '#FFFFFF', borderRadius: '18px', border: '1px solid rgba(0,0,0,0.07)', overflow: 'hidden' }}>
          {items.map(item => (
            <CartItemRow key={item.productId} item={item} onUpdateQuantity={updateQuantity} />
          ))}
        </div>

        {/* Summary */}
        <div style={{ background: '#FFFFFF', borderRadius: '18px', border: '1px solid rgba(0,0,0,0.07)', overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid #F4F4F6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '13px', color: '#9A9AA8' }}>Subtotal</span>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#0A0A0F' }}>{formatPrice(total)}</span>
          </div>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid #F4F4F6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '13px', color: '#9A9AA8' }}>Cargo por servicio</span>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#16A34A' }}>Gratis</span>
          </div>
          <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '15px', fontWeight: 700, color: '#0A0A0F' }}>Total</span>
            <span style={{ fontSize: '22px', fontWeight: 800, color: '#0A0A0F', letterSpacing: '-0.04em' }}>{formatPrice(total)}</span>
          </div>
        </div>

        {/* CTA */}
        <div style={{ marginTop: 'auto', paddingBottom: '8px' }}>
          <button
            onClick={() => router.push(`/${eventId}/checkout`)}
            style={{
              width: '100%', borderRadius: '100px',
              background: '#C6FF00', color: '#0A0F00',
              border: 'none', padding: '16px',
              fontSize: '16px', fontWeight: 800,
              letterSpacing: '-0.02em',
              cursor: 'pointer', fontFamily: font,
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.88' }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1' }}
          >
            Ir a pagar · {formatPrice(total)}
          </button>
        </div>

      </div>
    </div>
  )
}
