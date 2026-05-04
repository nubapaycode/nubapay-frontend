import type { Order, OrderStatus } from '@/types'
import { OrderCard } from './OrderCard'

interface Column {
  key: OrderStatus
  label: string
  accent: string
  bg: string
}

const COLUMNS: Column[] = [
  { key: 'pending',   label: 'Pendiente',     accent: '#F59E0B', bg: 'rgba(245,158,11,0.08)'  },
  { key: 'preparing', label: 'En preparación', accent: '#3B82F6', bg: 'rgba(59,130,246,0.08)' },
  { key: 'ready',     label: 'Listo',          accent: '#C6FF00', bg: 'rgba(198,255,0,0.1)'   },
  { key: 'delivered', label: 'Entregado',      accent: '#9A9AA8', bg: 'rgba(154,154,168,0.08)' },
]

interface OrderKanbanProps {
  orders: Order[]
  onMarkReady: (id: string) => void
  onMarkDelivered: (id: string) => void
}

export function OrderKanban({ orders, onMarkReady, onMarkDelivered }: OrderKanbanProps) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: '12px',
      fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)",
    }}>
      {COLUMNS.map(col => {
        const colOrders = orders.filter(o => o.status === col.key)
        return (
          <div key={col.key} style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: 0 }}>
            {/* Column header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 10px',
              background: col.bg,
              borderRadius: '10px',
            }}>
              <span style={{
                width: '7px', height: '7px',
                borderRadius: '50%',
                background: col.accent,
                flexShrink: 0,
              }} />
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#0A0A0F', flex: 1 }}>
                {col.label}
              </span>
              <span style={{
                fontSize: '11px',
                fontWeight: 700,
                color: col.accent === '#C6FF00' ? '#5A6000' : col.accent,
                background: `${col.accent}22`,
                borderRadius: '100px',
                padding: '1px 7px',
                minWidth: '20px',
                textAlign: 'center',
              }}>
                {colOrders.length}
              </span>
            </div>

            {/* Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {colOrders.map(order => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onMarkReady={
                    col.key === 'pending' || col.key === 'preparing'
                      ? () => onMarkReady(order.id)
                      : undefined
                  }
                  onMarkDelivered={
                    col.key === 'ready' ? () => onMarkDelivered(order.id) : undefined
                  }
                />
              ))}

              {colOrders.length === 0 && (
                <div style={{
                  borderRadius: '12px',
                  border: '1.5px dashed rgba(0,0,0,0.07)',
                  padding: '20px 12px',
                  textAlign: 'center',
                }}>
                  <p style={{ fontSize: '11px', color: '#C4C4CF', margin: 0 }}>Sin pedidos</p>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
