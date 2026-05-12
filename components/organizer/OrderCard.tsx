'use client'

import type { Order } from '@/types'
import { organizerAccentFilledButtonStyle } from '@/lib/organizerAccentCss'
import { formatPrice } from '@/lib/utils'

interface OrderCardProps {
  order: Order
  onMarkReady?: () => void
  onMarkDelivered?: () => void
}

const paymentLabels: Record<string, string> = {
  mp: 'Mercado Pago', cash: 'Efectivo', transfer: 'Transferencia',
}

const paymentColors: Record<string, string> = {
  mp: '#009EE3',
  cash: '#6B7280',
  transfer: '#8B5CF6',
}

export function OrderCard({ order, onMarkReady, onMarkDelivered }: OrderCardProps) {
  const pm = order.paymentMethod ?? ''

  return (
    <div
      style={{
        background: '#FFFFFF',
        borderRadius: '14px',
        border: '1px solid rgba(0,0,0,0.07)',
        padding: '14px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)",
        transition: 'box-shadow 0.15s',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 12px rgba(0,0,0,0.08)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = 'none' }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontFamily: 'monospace', fontSize: '11px', color: '#9A9AA8', letterSpacing: '0.04em' }}>
          #{order.id.slice(0, 8).toUpperCase()}
        </span>
        {pm && (
          <span style={{
            fontSize: '10px',
            fontWeight: 600,
            color: paymentColors[pm] ?? '#6B7280',
            background: `${paymentColors[pm] ?? '#6B7280'}14`,
            borderRadius: '100px',
            padding: '2px 8px',
            letterSpacing: '0.02em',
          }}>
            {paymentLabels[pm] ?? pm}
          </span>
        )}
      </div>

      {/* Items */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
        {order.items.map((item, idx) => (
          <div key={`${order.id}-${idx}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: '#0A0A0F', lineHeight: '1.4', flex: 1 }}>{item.name}</span>
            <span style={{
              fontSize: '10px',
              fontWeight: 700,
              color: '#9A9AA8',
              background: '#F4F4F6',
              borderRadius: '6px',
              padding: '1px 6px',
              flexShrink: 0,
            }}>×{item.quantity}</span>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '10px', borderTop: '1px solid #F4F4F6' }}>
        <span style={{ fontSize: '14px', fontWeight: 700, color: '#0A0A0F', letterSpacing: '-0.02em' }}>
          {formatPrice(order.total)}
        </span>

        {(order.status === 'pending' || order.status === 'preparing') && onMarkReady && (
          <button
            onClick={onMarkReady}
            style={{
              fontSize: '11px',
              fontWeight: 700,
              ...organizerAccentFilledButtonStyle(),
              border: 'none',
              borderRadius: '100px',
              padding: '5px 12px',
              cursor: 'pointer',
              letterSpacing: '-0.01em',
              transition: 'opacity 0.15s',
              fontFamily: "inherit",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.8' }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1' }}
          >
            Marcar listo
          </button>
        )}
        {order.status === 'ready' && onMarkDelivered && (
          <button
            onClick={onMarkDelivered}
            style={{
              fontSize: '11px',
              fontWeight: 700,
              ...organizerAccentFilledButtonStyle(),
              border: 'none',
              borderRadius: '100px',
              padding: '5px 12px',
              cursor: 'pointer',
              letterSpacing: '-0.01em',
              transition: 'opacity 0.15s',
              fontFamily: "inherit",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.75' }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1' }}
          >
            Confirmar entrega
          </button>
        )}
        {order.status === 'delivered' && (
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#16A34A', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#16A34A" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Entregado
          </span>
        )}
      </div>
    </div>
  )
}
