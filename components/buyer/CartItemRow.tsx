'use client'

import type { CartItem } from '@/types'
import { formatPrice } from '@/lib/utils'

interface CartItemRowProps {
  item: CartItem
  onUpdateQuantity: (productId: string, quantity: number) => void
}

export function CartItemRow({ item, onUpdateQuantity }: CartItemRowProps) {
  const font = "var(--font-dm-sans, 'DM Sans', sans-serif)"

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '12px',
      padding: '12px 16px',
      borderBottom: '1px solid #F4F4F6',
      fontFamily: font,
    }}
    className="last:border-0"
    >
      {/* Product image */}
      <div style={{
        width: '64px', height: '64px', borderRadius: '12px',
        background: '#F4F4F6',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, overflow: 'hidden',
      }}>
        {item.imageUrl ? (
          <img src={item.imageUrl} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M9 2a3 3 0 100 6 3 3 0 000-6zM3 14c0-3 2.7-5 6-5s6 2 6 5" stroke="#C4C4CF" strokeWidth="1.25" strokeLinecap="round"/>
          </svg>
        )}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#0A0A0F', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {item.name}
        </p>
        <p style={{ margin: '2px 0 0', fontSize: '13px', fontWeight: 700, color: '#9A9AA8', letterSpacing: '-0.01em' }}>
          {formatPrice(item.price * item.quantity)}
        </p>
      </div>

      {/* Quantity stepper */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        <button
          onClick={() => onUpdateQuantity(item.productId, item.quantity - 1)}
          style={{
            width: '30px', height: '30px', borderRadius: '50%',
            border: '1.5px solid rgba(0,0,0,0.1)',
            background: '#FFFFFF',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', fontSize: '16px', color: '#0A0A0F',
            fontFamily: font, lineHeight: 1,
            transition: 'background 0.1s',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#F4F4F6' }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#FFFFFF' }}
        >
          −
        </button>
        <span style={{ width: '20px', textAlign: 'center', fontSize: '15px', fontWeight: 700, color: '#0A0A0F' }}>
          {item.quantity}
        </span>
        <button
          onClick={() => onUpdateQuantity(item.productId, item.quantity + 1)}
          style={{
            width: '30px', height: '30px', borderRadius: '50%',
            border: 'none',
            background: '#C6FF00',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', fontSize: '16px', color: '#0A0F00',
            fontFamily: font, lineHeight: 1,
            transition: 'opacity 0.1s',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.8' }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1' }}
        >
          +
        </button>
      </div>
    </div>
  )
}
