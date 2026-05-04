'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import { fetchWorkspaceOrders, patchOrderStatus } from '@/lib/organizerWorkspace'
import type { PaginationMeta } from '@/lib/organizerWorkspace'
import type { Order } from '@/types'

import { OrderKanban } from './OrderKanban'

const ORDERS_PAGE_SIZE = 40
const POLL_INTERVAL = 15_000

export function OrdersView({ eventId }: { eventId: string }) {
  const [orders, setOrders] = useState<Order[]>([])
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState<PaginationMeta>({ page: 1, page_size: ORDERS_PAGE_SIZE, total: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    else setRefreshing(true)
    setError('')
    const res = await fetchWorkspaceOrders(eventId, { page, pageSize: ORDERS_PAGE_SIZE })
    if (!res.ok) {
      setError(res.error)
      if (!silent) setOrders([])
    } else {
      setOrders(res.orders.filter(o => o.status !== 'cancelled'))
      setPagination(res.pagination)
      setLastRefresh(new Date())
    }
    setLoading(false)
    setRefreshing(false)
  }, [eventId, page])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    pollRef.current = setInterval(() => load(true), POLL_INTERVAL)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [load])

  const handleMarkReady = async (id: string) => {
    const prev = orders
    setOrders(p => p.map(o => (o.id === id ? { ...o, status: 'ready' as const } : o)))
    const res = await patchOrderStatus(eventId, id, 'ready')
    if (!res.ok) { setOrders(prev); setError(res.error) }
    else setOrders(p => p.map(o => (o.id === id ? res.order : o)))
  }

  const handleMarkDelivered = async (id: string) => {
    const prev = orders
    setOrders(p => p.map(o => (o.id === id ? { ...o, status: 'delivered' as const } : o)))
    const res = await patchOrderStatus(eventId, id, 'delivered')
    if (!res.ok) { setOrders(prev); setError(res.error) }
    else setOrders(p => p.map(o => (o.id === id ? res.order : o)))
  }

  const pending = orders.filter(o => o.status === 'pending').length
  const preparing = orders.filter(o => o.status === 'preparing').length

  const fmt = (d: Date) => d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })

  return (
    <div style={{ fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)" }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 600, color: '#0A0A0F', margin: '0 0 4px 0', letterSpacing: '-0.03em' }}>
            Pedidos
          </h1>
          <p style={{ fontSize: '13px', color: '#9A9AA8', margin: 0 }}>
            Actualizacion automática cada 15 s
            {lastRefresh && (
              <span style={{ marginLeft: '8px', color: '#C4C4CF' }}>· última: {fmt(lastRefresh)}</span>
            )}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Live pill */}
          {(pending + preparing) > 0 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(245,158,11,0.08)',
              border: '1px solid rgba(245,158,11,0.2)',
              borderRadius: '100px',
              padding: '5px 12px',
              fontSize: '12px',
              fontWeight: 600,
              color: '#B45309',
            }}>
              <span style={{
                width: '6px', height: '6px', borderRadius: '50%',
                background: '#F59E0B',
                boxShadow: '0 0 0 3px rgba(245,158,11,0.25)',
                animation: 'nb-pulse 1.5s ease-in-out infinite',
              }} />
              {pending + preparing} activo{(pending + preparing) !== 1 ? 's' : ''}
            </div>
          )}

          <button
            onClick={() => load(true)}
            disabled={refreshing || loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: '#FFFFFF',
              border: '1px solid rgba(0,0,0,0.1)',
              borderRadius: '10px',
              padding: '6px 14px',
              fontSize: '12px',
              fontWeight: 600,
              color: '#0A0A0F',
              cursor: refreshing || loading ? 'not-allowed' : 'pointer',
              opacity: refreshing ? 0.6 : 1,
              transition: 'opacity 0.15s, background 0.15s',
              fontFamily: 'inherit',
            }}
            onMouseEnter={e => { if (!refreshing) (e.currentTarget as HTMLButtonElement).style.background = '#F7F7FA' }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#FFFFFF' }}
          >
            <svg
              width="13" height="13" viewBox="0 0 13 13" fill="none"
              style={{ animation: refreshing ? 'nb-spin 0.7s linear infinite' : 'none' }}
            >
              <path d="M11 6.5A4.5 4.5 0 116.5 2M6.5 2L9 4.5M6.5 2L4 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Actualizar
          </button>
        </div>
      </div>

      {error && (
        <div style={{
          background: 'rgba(239,68,68,0.06)',
          border: '1px solid rgba(239,68,68,0.15)',
          borderRadius: '10px',
          padding: '10px 14px',
          fontSize: '13px',
          color: '#DC2626',
          marginBottom: '16px',
        }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', gap: '12px' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ animation: 'nb-spin 0.7s linear infinite', color: '#0A0A0F' }}>
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" opacity="0.15"/>
            <path d="M12 2a10 10 0 0110 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <p style={{ fontSize: '13px', color: '#9A9AA8', margin: 0 }}>Cargando pedidos…</p>
        </div>
      ) : (
        <OrderKanban
          orders={orders}
          onMarkReady={handleMarkReady}
          onMarkDelivered={handleMarkDelivered}
        />
      )}

      {/* Pagination */}
      {!loading && pagination.total > ORDERS_PAGE_SIZE && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '24px' }}>
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            style={{
              background: '#FFFFFF',
              border: '1px solid rgba(0,0,0,0.1)',
              borderRadius: '8px',
              padding: '6px 14px',
              fontSize: '12px',
              fontWeight: 600,
              color: page === 1 ? '#C4C4CF' : '#0A0A0F',
              cursor: page === 1 ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
              transition: 'background 0.15s',
            }}
          >
            ← Anterior
          </button>
          <span style={{ fontSize: '12px', color: '#9A9AA8', padding: '0 4px' }}>
            Página {pagination.page}
          </span>
          <button
            onClick={() => setPage(p => p + 1)}
            disabled={page * ORDERS_PAGE_SIZE >= pagination.total}
            style={{
              background: '#FFFFFF',
              border: '1px solid rgba(0,0,0,0.1)',
              borderRadius: '8px',
              padding: '6px 14px',
              fontSize: '12px',
              fontWeight: 600,
              color: page * ORDERS_PAGE_SIZE >= pagination.total ? '#C4C4CF' : '#0A0A0F',
              cursor: page * ORDERS_PAGE_SIZE >= pagination.total ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
              transition: 'background 0.15s',
            }}
          >
            Siguiente →
          </button>
        </div>
      )}

      <style>{`
        @keyframes nb-spin { to { transform: rotate(360deg); } }
        @keyframes nb-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
      `}</style>
    </div>
  )
}
