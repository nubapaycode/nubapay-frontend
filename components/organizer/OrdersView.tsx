'use client'

import { useCallback, useEffect, useState } from 'react'
import { RefreshCw } from 'lucide-react'

import { OrderList } from '@/components/organizer/OrderList'
import { PaginationBar } from '@/components/ui/PaginationBar'
import { Spinner } from '@/components/ui/Spinner'
import { fetchWorkspaceOrders, patchOrderStatus } from '@/lib/organizerWorkspace'
import type { PaginationMeta } from '@/lib/organizerWorkspace'
import type { Order, OrderStatus } from '@/types'

const ORDERS_PAGE_SIZE = 40

const STATUS_OPTIONS: { value: '' | OrderStatus; label: string }[] = [
  { value: '', label: 'Todos los estados' },
  { value: 'pending', label: 'Pendiente' },
  { value: 'preparing', label: 'En preparación' },
  { value: 'ready', label: 'Listo' },
  { value: 'delivered', label: 'Entregado' },
  { value: 'cancelled', label: 'Cancelado' },
]

export function OrdersView({ eventId }: { eventId: string }) {
  const [orders, setOrders] = useState<Order[]>([])
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    page_size: ORDERS_PAGE_SIZE,
    total: 0,
  })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [debouncedQ, setDebouncedQ] = useState('')
  const [statusFilter, setStatusFilter] = useState<'' | OrderStatus>('')

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(searchInput.trim()), 400)
    return () => clearTimeout(t)
  }, [searchInput])

  useEffect(() => {
    setPage(1)
  }, [debouncedQ, statusFilter])

  const load = useCallback(
    async (opts?: { silent?: boolean; isRefresh?: boolean }) => {
      const silent = opts?.silent === true
      const isRefresh = opts?.isRefresh === true
      if (isRefresh) setRefreshing(true)
      if (!silent) setError('')
      try {
        const res = await fetchWorkspaceOrders(eventId, {
          page,
          pageSize: ORDERS_PAGE_SIZE,
          q: debouncedQ || undefined,
          status: statusFilter || undefined,
        })
        if (!res.ok) {
          if (!silent) {
            setError(res.error)
            setOrders([])
          } else if (isRefresh) {
            setError(res.error)
          }
        } else {
          setOrders(res.orders)
          setPagination(res.pagination)
          setError('')
        }
        if (!silent) setLoading(false)
      } finally {
        if (isRefresh) setRefreshing(false)
      }
    },
    [eventId, page, debouncedQ, statusFilter],
  )

  useEffect(() => {
    setLoading(true)
    void load()
  }, [load])

  const handleRefresh = () => {
    void load({ silent: true, isRefresh: true })
  }

  const handleMarkReady = async (id: string) => {
    const prev = orders
    setOrders(p => p.map(o => (o.id === id ? { ...o, status: 'ready' as const } : o)))
    const res = await patchOrderStatus(eventId, id, 'ready')
    if (!res.ok) {
      setOrders(prev)
      setError(res.error)
    } else {
      await load({ silent: true })
    }
  }

  const handleMarkDelivered = async (id: string) => {
    const prev = orders
    setOrders(p => p.map(o => (o.id === id ? { ...o, status: 'delivered' as const } : o)))
    const res = await patchOrderStatus(eventId, id, 'delivered')
    if (!res.ok) {
      setOrders(prev)
      setError(res.error)
    } else {
      await load({ silent: true })
    }
  }

  if (loading) {
    return (
      <div className="max-w-6xl flex flex-col items-center justify-center py-24 gap-3">
        <Spinner size="lg" className="text-gray-900" />
        <p className="text-sm text-gray-400">Cargando pedidos…</p>
      </div>
    )
  }

  return (
    <div className="max-w-6xl">
      <div className="mb-6 md:-mt-5">
        <h1 className="text-xl font-medium text-gray-900">Pedidos</h1>
        <p className="text-xs text-gray-400 mt-1">
          Lista de pedidos del evento. Búsqueda por ID, cliente o productos; filtro por estado. Orden
          por fecha (más recientes primero).
        </p>
      </div>
      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center mb-4">
        <label className="flex-1 min-w-[200px]">
          <span className="sr-only">Buscar</span>
          <input
            type="search"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder="Buscar por ID, cliente, productos…"
            className="w-full rounded-full border border-gray-200 bg-white px-4 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
          />
        </label>
        <label className="sm:w-52 shrink-0">
          <span className="sr-only">Estado</span>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as '' | OrderStatus)}
            className="w-full rounded-full border border-gray-200 bg-white px-4 py-2 text-sm text-gray-900 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
          >
            {STATUS_OPTIONS.map(opt => (
              <option key={opt.value || 'all'} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={handleRefresh}
          disabled={refreshing}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50 disabled:opacity-50"
          aria-busy={refreshing}
          aria-label="Actualizar lista de pedidos"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} aria-hidden />
          Actualizar
        </button>
      </div>
      <OrderList orders={orders} onMarkReady={handleMarkReady} onMarkDelivered={handleMarkDelivered} />
      {pagination.total > 0 && (
        <div className="mt-6">
          <PaginationBar page={pagination.page} pageSize={pagination.page_size} total={pagination.total} onPageChange={setPage} />
        </div>
      )}
    </div>
  )
}
