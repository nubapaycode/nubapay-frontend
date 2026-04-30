'use client'

import { useCallback, useEffect, useState } from 'react'

import { PaginationBar } from '@/components/ui/PaginationBar'
import { Spinner } from '@/components/ui/Spinner'
import { fetchWorkspacePayments, type WorkspacePayment } from '@/lib/organizerWorkspace'
import { formatPrice } from '@/lib/utils'

const channelLabels: Record<string, string> = {
  mp: 'Mercado Pago',
  cash: 'Efectivo',
  transfer: 'Transferencia',
}

export function PaymentsView({ eventId }: { eventId: string }) {
  const [rows, setRows] = useState<WorkspacePayment[]>([])
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ page: 1, page_size: 20, total: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setError('')
    const res = await fetchWorkspacePayments(eventId, { page, pageSize: 20 })
    if (!res.ok) {
      setError(res.error)
      setRows([])
    } else {
      setRows(res.payments)
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
        <p className="text-sm text-gray-400">Cargando pagos…</p>
      </div>
    )
  }

  return (
    <div className="max-w-6xl">
      <div className="mb-6 md:-mt-5">
        <h1 className="text-xl font-medium text-gray-900">Pagos</h1>
        <p className="text-xs text-gray-400 mt-1">Registros de cobro asociados a pedidos del evento.</p>
      </div>
      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {rows.length === 0 ? (
          <div className="py-14 text-center px-4">
            <p className="text-sm text-gray-500">No hay pagos registrados todavía.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Proveedor</th>
                  <th className="px-4 py-3">Canal</th>
                  <th className="px-4 py-3 font-mono text-xs">Pedido</th>
                  <th className="px-4 py-3 text-right">Monto</th>
                  <th className="px-4 py-3 text-right">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {rows.map(row => (
                  <tr key={row.id} className="text-gray-900">
                    <td className="px-4 py-3 capitalize">{row.status}</td>
                    <td className="px-4 py-3 text-gray-600">{row.provider}</td>
                    <td className="px-4 py-3 text-gray-600">{row.channel ? channelLabels[row.channel] ?? row.channel : '—'}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-400">{row.order_id.slice(0, 8)}…</td>
                    <td className="px-4 py-3 text-right tabular-nums font-medium">{formatPrice(row.amount)}</td>
                    <td className="px-4 py-3 text-right text-xs text-gray-500 whitespace-nowrap">
                      {row.paid_at || row.created_at
                        ? new Date(row.paid_at || row.created_at || '').toLocaleString()
                        : '—'}
                    </td>
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
