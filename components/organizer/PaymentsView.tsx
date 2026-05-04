'use client'

import { useCallback, useEffect, useState } from 'react'

import { fetchWorkspacePayments, type WorkspacePayment } from '@/lib/organizerWorkspace'
import { formatPrice } from '@/lib/utils'

const channelLabels: Record<string, string> = {
  mp: 'Mercado Pago',
  cash: 'Efectivo',
  transfer: 'Transferencia',
}

const channelColors: Record<string, string> = {
  mp: '#009EE3',
  cash: '#22C55E',
  transfer: '#8B5CF6',
}

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  approved: { label: 'Aprobado',  color: '#16A34A', bg: 'rgba(22,163,74,0.08)'   },
  pending:  { label: 'Pendiente', color: '#B45309', bg: 'rgba(245,158,11,0.08)'  },
  rejected: { label: 'Rechazado', color: '#DC2626', bg: 'rgba(239,68,68,0.08)'   },
  refunded: { label: 'Reembolso', color: '#6B7280', bg: 'rgba(107,114,128,0.08)' },
}

const PAGE_SIZE = 20

export function PaymentsView({ eventId }: { eventId: string }) {
  const [rows, setRows] = useState<WorkspacePayment[]>([])
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ page: 1, page_size: PAGE_SIZE, total: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setError('')
    const res = await fetchWorkspacePayments(eventId, { page, pageSize: PAGE_SIZE })
    if (!res.ok) { setError(res.error); setRows([]) }
    else { setRows(res.payments); setPagination(res.pagination) }
    setLoading(false)
  }, [eventId, page])

  useEffect(() => { setLoading(true); load() }, [load])

  const font = "var(--font-dm-sans, 'DM Sans', sans-serif)"
  const totalPages = Math.ceil(pagination.total / PAGE_SIZE)

  const fmtDate = (s: string | null | undefined) => {
    if (!s) return '—'
    const d = new Date(s)
    return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' }) + ' ' + d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div style={{ fontFamily: font, maxWidth: '1000px' }}>

      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 600, color: '#0A0A0F', margin: '0 0 4px 0', letterSpacing: '-0.03em' }}>Pagos</h1>
        <p style={{ fontSize: '13px', color: '#9A9AA8', margin: 0 }}>Registros de cobro asociados a pedidos del evento.</p>
      </div>

      {error && (
        <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: '10px', padding: '10px 14px', fontSize: '13px', color: '#DC2626', marginBottom: '16px' }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', gap: '12px' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ animation: 'nb-spin 0.7s linear infinite' }}>
            <circle cx="12" cy="12" r="10" stroke="#0A0A0F" strokeWidth="2" opacity="0.15"/>
            <path d="M12 2a10 10 0 0110 10" stroke="#0A0A0F" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <p style={{ fontSize: '13px', color: '#9A9AA8', margin: 0 }}>Cargando pagos…</p>
        </div>
      ) : rows.length === 0 ? (
        <div style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.07)', borderRadius: '16px', padding: '64px 24px', textAlign: 'center' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: '#F7F7FA', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="2" y="5" width="16" height="12" rx="2" stroke="#C4C4CF" strokeWidth="1.5"/><path d="M2 9h16" stroke="#C4C4CF" strokeWidth="1.5" strokeLinecap="round"/><path d="M6 13h2" stroke="#C4C4CF" strokeWidth="1.5" strokeLinecap="round"/></svg>
          </div>
          <p style={{ fontSize: '14px', fontWeight: 600, color: '#0A0A0F', margin: '0 0 6px 0' }}>Sin pagos registrados</p>
          <p style={{ fontSize: '12px', color: '#9A9AA8', margin: 0 }}>Los cobros del evento aparecerán acá</p>
        </div>
      ) : (
        <>
          <div style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.07)', borderRadius: '16px', overflow: 'hidden' }}>
            {/* Table header */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '100px 130px 140px 1fr 110px 120px',
              padding: '10px 20px',
              borderBottom: '1px solid rgba(0,0,0,0.06)',
              background: '#FAFAFA',
            }}>
              {['Estado', 'Proveedor', 'Canal', 'Pedido', 'Monto', 'Fecha'].map((h, i) => (
                <span key={h} style={{ fontSize: '10px', fontWeight: 700, color: '#9A9AA8', letterSpacing: '0.08em', textTransform: 'uppercase', textAlign: i >= 4 ? 'right' : 'left' }}>
                  {h}
                </span>
              ))}
            </div>

            {/* Rows */}
            {rows.map((row, idx) => {
              const st = statusConfig[row.status] ?? { label: row.status, color: '#6B7280', bg: 'rgba(107,114,128,0.08)' }
              const ch = row.channel ?? ''
              return (
                <div
                  key={row.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '100px 130px 140px 1fr 110px 120px',
                    padding: '12px 20px',
                    borderBottom: idx < rows.length - 1 ? '1px solid rgba(0,0,0,0.04)' : 'none',
                    alignItems: 'center',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = '#FAFAFA' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'transparent' }}
                >
                  <div>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: st.color, background: st.bg, borderRadius: '100px', padding: '2px 8px' }}>
                      {st.label}
                    </span>
                  </div>
                  <span style={{ fontSize: '12px', color: '#4B4B5A' }}>{row.provider ?? '—'}</span>
                  <div>
                    {ch ? (
                      <span style={{ fontSize: '11px', fontWeight: 600, color: channelColors[ch] ?? '#6B7280', background: `${channelColors[ch] ?? '#6B7280'}14`, borderRadius: '100px', padding: '2px 8px' }}>
                        {channelLabels[ch] ?? ch}
                      </span>
                    ) : <span style={{ fontSize: '12px', color: '#C4C4CF' }}>—</span>}
                  </div>
                  <span style={{ fontFamily: 'monospace', fontSize: '11px', color: '#9A9AA8', letterSpacing: '0.04em' }}>
                    #{row.order_id.slice(0, 8).toUpperCase()}
                  </span>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#0A0A0F', textAlign: 'right', letterSpacing: '-0.02em' }}>
                    {formatPrice(row.amount)}
                  </span>
                  <span style={{ fontSize: '11px', color: '#9A9AA8', textAlign: 'right' }}>
                    {fmtDate(row.paid_at || row.created_at)}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '16px' }}>
              <span style={{ fontSize: '12px', color: '#9A9AA8' }}>
                {pagination.total} registros · Página {page} de {totalPages}
              </span>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '8px', padding: '6px 14px', fontSize: '12px', fontWeight: 600, color: page === 1 ? '#C4C4CF' : '#0A0A0F', cursor: page === 1 ? 'not-allowed' : 'pointer', fontFamily: font }}
                >
                  ←
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '8px', padding: '6px 14px', fontSize: '12px', fontWeight: 600, color: page === totalPages ? '#C4C4CF' : '#0A0A0F', cursor: page === totalPages ? 'not-allowed' : 'pointer', fontFamily: font }}
                >
                  →
                </button>
              </div>
            </div>
          )}
        </>
      )}

      <style>{`@keyframes nb-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
