'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { RefreshCw } from 'lucide-react'

import { OrganizerToolHeading } from '@/components/organizer/OrganizerToolHeading'
import { Modal } from '@/components/ui/Modal'
import { PaginationBar } from '@/components/ui/PaginationBar'
import { Spinner } from '@/components/ui/Spinner'
import { ORGANIZER_ACCENT_BACKGROUND, ORGANIZER_ACCENT_FOREGROUND } from '@/lib/organizerAccentCss'
import { fetchAllCategories, fetchWorkspaceOrders } from '@/lib/organizerWorkspace'
import type { PaginationMeta, WorkspaceCategory } from '@/lib/organizerWorkspace'
import { formatPrice } from '@/lib/utils'
import type { Order } from '@/types'

const PAGE_SIZE = 20
const POLL_INTERVAL = 15_000


const STATUS_LABEL: Record<string, string> = {
  pending:   'Pagado',
  preparing: 'Pagado',
  ready:     'Pagado',
  delivered: 'Entregado',
}

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  pending:   { bg: 'rgba(16,185,129,0.08)',  color: '#047857' },
  preparing: { bg: 'rgba(16,185,129,0.08)',  color: '#047857' },
  ready:     { bg: 'rgba(16,185,129,0.08)',  color: '#047857' },
  delivered: { bg: 'rgba(107,114,128,0.08)', color: '#4B5563' },
}

const PAY_LABEL: Record<string, string> = {
  mp: 'Mercado Pago',
  cash: 'Efectivo',
  transfer: 'Transferencia',
}

function fmtDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' }) +
    ' ' + d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
}

export function OrdersView({ eventId }: { eventId: string }) {
  const [orders, setOrders] = useState<Order[]>([])
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState<PaginationMeta>({ page: 1, page_size: PAGE_SIZE, total: 0 })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [searchQ, setSearchQ] = useState('')
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)
  const [detailOrder, setDetailOrder] = useState<Order | null>(null)
  const [categories, setCategories] = useState<WorkspaceCategory[]>([])
  const [selectedCats, setSelectedCats] = useState<Set<string>>(new Set())
  const [catDropdownOpen, setCatDropdownOpen] = useState(false)
  const catDropdownRef = useRef<HTMLDivElement>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    const t = window.setTimeout(() => setSearchQ(searchInput.trim()), 350)
    return () => window.clearTimeout(t)
  }, [searchInput])

  useEffect(() => { setPage(1) }, [searchQ])

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    else setRefreshing(true)
    setError('')
    const res = await fetchWorkspaceOrders(eventId, {
      page,
      pageSize: PAGE_SIZE,
      paymentStatus: 'approved',
      q: searchQ || undefined,
    })
    if (!res.ok) {
      setError(res.error)
      if (!silent) setOrders([])
    } else {
      setOrders(res.orders)
      setPagination(res.pagination)
      setLastRefresh(new Date())
    }
    setLoading(false)
    setRefreshing(false)
  }, [eventId, page, searchQ])

  useEffect(() => { void load() }, [load])

  useEffect(() => {
    pollRef.current = setInterval(() => void load(true), POLL_INTERVAL)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [load])

  useEffect(() => {
    fetchAllCategories(eventId).then(res => {
      if (res.ok) setCategories(res.categories)
    })
  }, [eventId])

  useEffect(() => {
    if (!catDropdownOpen) return
    const handler = (e: MouseEvent) => {
      if (catDropdownRef.current && !catDropdownRef.current.contains(e.target as Node))
        setCatDropdownOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [catDropdownOpen])

  const displayOrders = selectedCats.size === 0
    ? orders
    : orders.filter(o => o.items.some(i => i.categoryName && selectedCats.has(i.categoryName)))

  return (
    <div style={{ fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)" }}>
      <style>{`
        @keyframes nb-spin { to { transform: rotate(360deg); } }
        @keyframes nb-select-pop { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
        .nb-order-row { transition: background 0.12s; }
        .nb-order-row:hover { background: #FAFAFA !important; }
        .nb-search-input:focus { outline: none; border-color: #0A0A0F !important; box-shadow: 0 0 0 3px rgba(0,0,0,0.06); }
        .nb-select-opt:hover { background: #F5F5F7 !important; }

        /* ── Responsive ── */
        @media (max-width: 768px) {
          .nb-orders-filters { flex-wrap: wrap; }
          .nb-orders-search { flex: 1 1 100% !important; }
          .nb-orders-cats { min-width: 0 !important; flex: 1 !important; }
          .nb-orders-tabs button { padding: 7px 14px !important; }

          .nb-orders-table-header { display: none !important; }

          .nb-order-row {
            grid-template-columns: 1fr auto auto !important;
            grid-template-areas:
              "num    status eye"
              "items  items  items"
              "cust   total  total" !important;
            padding: 14px 16px !important;
            gap: 6px 10px !important;
          }
          .nb-cell-num    { grid-area: num; }
          .nb-cell-items  { grid-area: items; }
          .nb-cell-cust   { grid-area: cust; font-size: 13px !important; color: #0A0A0F !important; font-weight: 500 !important; }
          .nb-cell-cust .nb-cust-label { display: inline !important; }
          .nb-cell-total  { grid-area: total; text-align: right; }
          .nb-cell-status { grid-area: status; align-self: center; }
          .nb-cell-eye    { grid-area: eye; align-self: center; }
        }

        @media (max-width: 480px) {
          .nb-orders-tabs button { padding: 7px 10px !important; font-size: 12px !important; }
        }
      `}</style>

      <OrganizerToolHeading
        title="Pedidos"
        description={
          <p style={{ fontSize: '13px', color: '#9A9AA8', margin: 0 }}>
            Actualización automática cada 15 s
            {lastRefresh && (
              <span style={{ marginLeft: '8px', color: '#C4C4CF' }}>
                · última: {lastRefresh.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            )}
          </p>
        }
        actions={
          <button
            onClick={() => void load(true)}
            disabled={refreshing || loading}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.1)',
              borderRadius: '100px', padding: '7px 14px',
              fontSize: '13px', fontWeight: 500, color: '#6B7280',
              cursor: refreshing || loading ? 'not-allowed' : 'pointer',
              opacity: refreshing ? 0.6 : 1,
            }}
          >
            <RefreshCw size={13} style={{ animation: refreshing ? 'nb-spin 0.7s linear infinite' : 'none' }} />
            Actualizar
          </button>
        }
      />

      {/* Filters */}
      <div className="nb-orders-filters" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        {/* Search */}
        <div className="nb-orders-search" style={{ position: 'relative', flex: 1 }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
            style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#9A9AA8', pointerEvents: 'none' }}>
            <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.4"/>
            <path d="M9.5 9.5L12 12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
          <input
            type="text"
            className="nb-search-input"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder="Buscar por cliente, producto o nº de pedido…"
            style={{
              width: '100%', boxSizing: 'border-box',
              paddingLeft: '38px', paddingRight: '14px', paddingTop: '10px', paddingBottom: '10px',
              border: '1px solid rgba(0,0,0,0.08)', borderRadius: '12px',
              fontSize: '13px', color: '#0A0A0F', background: '#FFFFFF',
              transition: 'border-color 0.15s, box-shadow 0.15s',
            }}
          />
        </div>

        {/* Category multi-select */}
        {categories.length > 0 && (
          <div ref={catDropdownRef} className="nb-orders-cats" style={{ position: 'relative', flexShrink: 0, minWidth: '160px' }}>
            <button
              type="button"
              onClick={() => setCatDropdownOpen(o => !o)}
              aria-haspopup="listbox"
              aria-expanded={catDropdownOpen}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px',
                borderRadius: '12px',
                border: '1px solid ' + (catDropdownOpen ? '#0A0A0F' : 'rgba(0,0,0,0.1)'),
                background: '#FAFAFA',
                padding: '10px 14px',
                fontSize: '13px', color: '#0A0A0F',
                cursor: 'pointer', textAlign: 'left',
                boxShadow: catDropdownOpen ? '0 0 0 3px rgba(0,0,0,0.06)' : 'none',
                transition: 'border-color 0.15s, box-shadow 0.15s',
                outline: 'none', boxSizing: 'border-box',
              }}
            >
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {selectedCats.size === 0
                  ? 'Todas las categorías'
                  : selectedCats.size === 1
                  ? [...selectedCats][0]
                  : `${selectedCats.size} categorías`}
              </span>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"
                style={{ flexShrink: 0, color: '#6B7280', transform: catDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>
                <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            {catDropdownOpen && (
              <div
                role="listbox"
                style={{
                  position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 60,
                  background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.1)',
                  borderRadius: '14px', boxShadow: '0 12px 32px rgba(0,0,0,0.12)',
                  padding: '6px', maxHeight: '260px', overflowY: 'auto',
                  animation: 'nb-select-pop 0.15s cubic-bezier(0.16,1,0.3,1)',
                  display: 'flex', flexDirection: 'column', gap: '6px',
                }}
              >
                {categories.map(cat => {
                  const active = selectedCats.has(cat.name)
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      role="option"
                      aria-selected={active}
                      onClick={() => setSelectedCats(prev => {
                        const next = new Set(prev)
                        active ? next.delete(cat.name) : next.add(cat.name)
                        return next
                      })}
                      className="nb-select-opt"
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px',
                        background: active ? ORGANIZER_ACCENT_BACKGROUND : 'transparent',
                        border: 'none', borderRadius: '10px',
                        padding: '9px 12px', fontSize: '13px',
                        color: active ? ORGANIZER_ACCENT_FOREGROUND : '#0A0A0F', cursor: 'pointer', textAlign: 'left',
                      }}
                    >
                      <span>{cat.name}</span>
                      {active && (
                        <svg width="13" height="13" viewBox="0 0 13 13" fill="none" style={{ flexShrink: 0 }}>
                          <path d="M2.5 6.5l3 3 5-5" stroke={ORGANIZER_ACCENT_FOREGROUND} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </button>
                  )
                })}
                {selectedCats.size > 0 && (
                  <>
                    <div style={{ height: '1px', background: 'rgba(0,0,0,0.06)' }} />
                    <button
                      type="button"
                      onClick={() => { setSelectedCats(new Set()); setCatDropdownOpen(false) }}
                      className="nb-select-opt"
                      style={{
                        width: '100%', border: 'none', borderRadius: '10px',
                        padding: '9px 12px', fontSize: '13px',
                        color: '#9A9AA8', background: 'transparent', cursor: 'pointer', textAlign: 'left',
                      }}
                    >
                      Limpiar filtro
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        )}


      </div>

      {error && (
        <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: '12px', padding: '10px 14px', fontSize: '13px', color: '#DC2626', marginBottom: '16px' }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', gap: '12px' }}>
          <Spinner size="lg" className="text-gray-900" />
          <p style={{ fontSize: '13px', color: '#9A9AA8', margin: 0 }}>Cargando pedidos…</p>
        </div>
      ) : displayOrders.length === 0 ? (
        <div style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.07)', borderRadius: '20px', padding: '64px 24px', textAlign: 'center' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#F5F5F7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <path d="M4 4h14v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4z" stroke="#C8C8D0" strokeWidth="1.5" strokeLinejoin="round"/>
              <path d="M8 4V2M14 4V2M4 9h14" stroke="#C8C8D0" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <p style={{ fontSize: '15px', fontWeight: 600, color: '#0A0A0F', margin: '0 0 6px 0' }}>Sin pedidos</p>
          <p style={{ fontSize: '13px', color: '#9A9AA8', margin: 0 }}>
            {searchQ || selectedCats.size > 0 ? 'Probá otra búsqueda o quitá filtros.' : 'Los pedidos pagados aparecerán acá.'}
          </p>
        </div>
      ) : (
        <div style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.07)', borderRadius: '16px', overflow: 'hidden', position: 'relative' }}>
          {refreshing && (
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'rgba(0,0,0,0.06)' }} />
          )}

          {/* Header row */}
          <div className="nb-orders-table-header" style={{ display: 'grid', gridTemplateColumns: '80px 1fr 140px 110px 110px 36px', gap: '0', padding: '10px 16px', background: '#FAFAFA', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#9A9AA8' }}># Pedido</span>
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#9A9AA8' }}>Productos</span>
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#9A9AA8' }}>Cliente</span>
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#9A9AA8' }}>Total</span>
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#9A9AA8' }}>Estado</span>
            <span />
          </div>

          {displayOrders.map((order, idx) => {
            const statusStyle = STATUS_STYLE[order.status] ?? STATUS_STYLE.pending
            const statusLabel = STATUS_LABEL[order.status] ?? order.status

            return (
              <div
                key={order.id}
                className="nb-order-row"
                style={{
                  display: 'grid',
                  gridTemplateColumns: '80px 1fr 140px 110px 110px 36px',
                  gap: '0',
                  padding: '14px 16px',
                  borderTop: idx === 0 ? 'none' : '1px solid rgba(0,0,0,0.04)',
                  background: '#FFFFFF',
                  alignItems: 'center',
                }}
              >
                {/* Order number */}
                <span className="nb-cell-num" style={{ fontSize: '13px', fontWeight: 600, color: '#0A0A0F' }}>
                  {order.orderNumber != null ? `#${order.orderNumber}` : '—'}
                </span>

                {/* Products summary */}
                <div className="nb-cell-items" style={{ minWidth: 0 }}>
                  <p style={{ fontSize: '13px', color: '#0A0A0F', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {order.items.map(i => `${i.name}${i.quantity > 1 ? ` ×${i.quantity}` : ''}`).join(', ')}
                  </p>
                  {order.items.some(i => i.categoryName) && (
                    <p style={{ fontSize: '11px', color: '#9A9AA8', margin: '2px 0 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {[...new Set(order.items.map(i => i.categoryName).filter(Boolean))].join(' · ')}
                    </p>
                  )}
                </div>

                {/* Customer */}
                <span className="nb-cell-cust" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  <span className="nb-cust-label" style={{ display: 'none', fontSize: '10px', color: '#9A9AA8', marginRight: '4px', fontWeight: 500 }}>Cliente:</span>
                  <span style={{ color: order.customerName ? undefined : '#C8C8D0' }}>{order.customerName ?? '—'}</span>
                </span>

                {/* Total */}
                <span className="nb-cell-total" style={{ fontSize: '13px', fontWeight: 600, color: '#0A0A0F' }}>
                  {formatPrice(order.total)}
                </span>

                {/* Status badge */}
                <div className="nb-cell-status">
                  <span style={{
                    display: 'inline-flex', alignItems: 'center',
                    background: statusStyle.bg, color: statusStyle.color,
                    fontSize: '11px', fontWeight: 600,
                    padding: '3px 8px', borderRadius: '100px',
                  }}>
                    {statusLabel}
                  </span>
                </div>

                {/* Eye button */}
                <button
                  type="button"
                  className="nb-cell-eye"
                  onClick={() => setDetailOrder(order)}
                  aria-label="Ver detalle"
                  style={{
                    width: '30px', height: '30px', borderRadius: '8px',
                    border: '1px solid rgba(0,0,0,0.08)', background: '#FFFFFF',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', color: '#9A9AA8', flexShrink: 0,
                    transition: 'background 0.15s, color 0.15s, border-color 0.15s',
                  }}
                  onMouseEnter={e => {
                    const b = e.currentTarget
                    b.style.background = '#F5F5F7'
                    b.style.color = '#0A0A0F'
                    b.style.borderColor = 'rgba(0,0,0,0.14)'
                  }}
                  onMouseLeave={e => {
                    const b = e.currentTarget
                    b.style.background = '#FFFFFF'
                    b.style.color = '#9A9AA8'
                    b.style.borderColor = 'rgba(0,0,0,0.08)'
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <ellipse cx="7" cy="7" rx="6" ry="4" stroke="currentColor" strokeWidth="1.3"/>
                    <circle cx="7" cy="7" r="1.8" fill="currentColor"/>
                  </svg>
                </button>
              </div>
            )
          })}
        </div>
      )}

      {!loading && pagination.total > PAGE_SIZE && (
        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center' }}>
          <PaginationBar
            page={page}
            pageSize={PAGE_SIZE}
            total={pagination.total}
            onPageChange={setPage}
          />
        </div>
      )}

      {/* Order detail modal */}
      <Modal
        isOpen={detailOrder !== null}
        onClose={() => setDetailOrder(null)}
        containerClassName="z-[70]"
        className="!p-0 overflow-hidden max-w-md w-full"
      >
        {detailOrder && (() => {
          const o = detailOrder
          const statusStyle = STATUS_STYLE[o.status] ?? STATUS_STYLE.pending
          const statusLabel = STATUS_LABEL[o.status] ?? o.status
          return (
            <div>
              {/* Header */}
              <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                <div>
                  <p style={{ fontSize: '16px', fontWeight: 700, color: '#0A0A0F', margin: 0, letterSpacing: '-0.02em' }}>
                    {o.orderNumber != null ? `Pedido #${o.orderNumber}` : 'Detalle del pedido'}
                  </p>
                  <p style={{ fontSize: '12px', color: '#9A9AA8', margin: '3px 0 0 0' }}>{fmtDate(o.createdAt)}</p>
                </div>
                <span style={{
                  display: 'inline-flex', alignItems: 'center',
                  background: statusStyle.bg, color: statusStyle.color,
                  fontSize: '12px', fontWeight: 600,
                  padding: '4px 10px', borderRadius: '100px', flexShrink: 0,
                }}>
                  {statusLabel}
                </span>
              </div>

              {/* Items */}
              <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                <p style={{ fontSize: '11px', fontWeight: 600, color: '#9A9AA8', margin: '0 0 10px 0', letterSpacing: '-0.01em' }}>Productos</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {o.items.map((item, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontSize: '13px', fontWeight: 500, color: '#0A0A0F', margin: 0 }}>
                          {item.quantity > 1 && <span style={{ fontWeight: 700, color: '#6B7280' }}>{item.quantity}×&nbsp;</span>}
                          {item.name}
                        </p>
                        {item.categoryName && (
                          <p style={{ fontSize: '11px', color: '#9A9AA8', margin: '2px 0 0 0' }}>{item.categoryName}</p>
                        )}
                      </div>
                      <span style={{ fontSize: '13px', color: '#6B7280', fontVariantNumeric: 'tabular-nums', flexShrink: 0, paddingTop: '1px' }}>
                        {formatPrice(item.subtotal ?? item.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(0,0,0,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: '#0A0A0F' }}>Total</span>
                  <span style={{ fontSize: '16px', fontWeight: 700, color: '#0A0A0F', fontVariantNumeric: 'tabular-nums' }}>{formatPrice(o.total)}</span>
                </div>
              </div>

              {/* Info */}
              <div style={{ padding: '16px 20px 20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <p style={{ fontSize: '11px', fontWeight: 600, color: '#9A9AA8', margin: 0, letterSpacing: '-0.01em' }}>Información</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  {o.customerName && (
                    <div>
                      <p style={{ fontSize: '11px', color: '#9A9AA8', margin: '0 0 2px 0' }}>Cliente</p>
                      <p style={{ fontSize: '13px', fontWeight: 500, color: '#0A0A0F', margin: 0 }}>{o.customerName}</p>
                    </div>
                  )}
                  {o.customerPhone && (
                    <div>
                      <p style={{ fontSize: '11px', color: '#9A9AA8', margin: '0 0 2px 0' }}>Teléfono</p>
                      <p style={{ fontSize: '13px', color: '#0A0A0F', margin: 0 }}>{o.customerPhone}</p>
                    </div>
                  )}
                  {o.paymentMethod && (
                    <div>
                      <p style={{ fontSize: '11px', color: '#9A9AA8', margin: '0 0 2px 0' }}>Método de pago</p>
                      <p style={{ fontSize: '13px', color: '#0A0A0F', margin: 0 }}>{PAY_LABEL[o.paymentMethod] ?? o.paymentMethod}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })()}
      </Modal>
    </div>
  )
}
