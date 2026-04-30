'use client'

import { useCallback, useEffect, useState } from 'react'

import { PaginationBar } from '@/components/ui/PaginationBar'
import { Spinner } from '@/components/ui/Spinner'
import { fetchWorkspaceOrders, patchOrderStatus } from '@/lib/organizerWorkspace'
import type { PaginationMeta } from '@/lib/organizerWorkspace'
import type { Order } from '@/types'

import { OrderKanban } from './OrderKanban'

const ORDERS_PAGE_SIZE = 40

export function OrdersView({ eventId }: { eventId: string }) {
  const [orders, setOrders] = useState<Order[]>([])
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    page_size: ORDERS_PAGE_SIZE,
    total: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setError('')
    const res = await fetchWorkspaceOrders(eventId, { page, pageSize: ORDERS_PAGE_SIZE })
    if (!res.ok) {
      setError(res.error)
      setOrders([])
    } else {
      setOrders(res.orders.filter(o => o.status !== 'cancelled'))
      setPagination(res.pagination)
    }
    setLoading(false)
  }, [eventId, page])

  useEffect(() => {
    setLoading(true)
    load()
  }, [load])

  const handleMarkReady = async (id: string) => {
    const prev = orders
    setOrders(p => p.map(o => (o.id === id ? { ...o, status: 'ready' as const } : o)))
    const res = await patchOrderStatus(eventId, id, 'ready')
    if (!res.ok) {
      setOrders(prev)
      setError(res.error)
    } else {
      setOrders(p => p.map(o => (o.id === id ? res.order : o)))
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
      setOrders(p => p.map(o => (o.id === id ? res.order : o)))
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
          Tablero Kanban solo para este evento. Paginado por fecha (más recientes primero).
        </p>
      </div>
      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
      <OrderKanban
        orders={orders}
        onMarkReady={handleMarkReady}
        onMarkDelivered={handleMarkDelivered}
      />
      {pagination.total > 0 && (
        <div className="mt-6">
          <PaginationBar page={pagination.page} pageSize={pagination.page_size} total={pagination.total} onPageChange={setPage} />
        </div>
      )}
    </div>
  )
}
