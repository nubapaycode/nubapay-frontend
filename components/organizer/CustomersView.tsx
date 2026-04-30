'use client'

import { useCallback, useEffect, useState } from 'react'

import { PaginationBar } from '@/components/ui/PaginationBar'
import { Spinner } from '@/components/ui/Spinner'
import { fetchWorkspaceCustomers, type WorkspaceCustomer } from '@/lib/organizerWorkspace'
import { formatPrice } from '@/lib/utils'

export function CustomersView({ eventId }: { eventId: string }) {
  const [rows, setRows] = useState<WorkspaceCustomer[]>([])
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ page: 1, page_size: 20, total: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setError('')
    const res = await fetchWorkspaceCustomers(eventId, { page, pageSize: 20 })
    if (!res.ok) {
      setError(res.error)
      setRows([])
    } else {
      setRows(res.customers)
      setPagination(res.pagination)
    }
    setLoading(false)
  }, [eventId, page])

  useEffect(() => {
    setLoading(true)
    load()
  }, [load])

  if (loading) {
    return (
      <div className="max-w-6xl flex flex-col items-center justify-center py-24 gap-3">
        <Spinner size="lg" className="text-gray-900" />
        <p className="text-sm text-gray-400">Cargando clientes…</p>
      </div>
    )
  }

  return (
    <div className="max-w-6xl">
      <div className="mb-6 md:-mt-5">
        <h1 className="text-xl font-medium text-gray-900">Clientes</h1>
        <p className="text-xs text-gray-400 mt-1">Quienes compraron en este evento (según datos de pedidos).</p>
      </div>
      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {rows.length === 0 ? (
          <div className="py-14 text-center px-4">
            <p className="text-sm text-gray-500">Todavía no hay clientes con pedidos.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  <th className="px-4 py-3">Nombre</th>
                  <th className="px-4 py-3">Teléfono</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3 text-right">Pedidos</th>
                  <th className="px-4 py-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {rows.map(row => (
                  <tr key={row.id} className="text-gray-900">
                    <td className="px-4 py-3 font-medium">{row.name || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{row.phone || '—'}</td>
                    <td className="px-4 py-3 text-gray-600 truncate max-w-[180px]" title={row.email ?? ''}>{row.email || '—'}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{row.orders_count}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{formatPrice(row.total_spent)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {pagination.total > 0 && (
        <div className="mt-4">
          <PaginationBar
            page={pagination.page}
            pageSize={pagination.page_size}
            total={pagination.total}
            onPageChange={setPage}
          />
        </div>
      )}
    </div>
  )
}
