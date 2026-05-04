'use client'

import { useCallback, useEffect, useState } from 'react'

import { OrganizerToolHeading } from '@/components/organizer/OrganizerToolHeading'
import { PaginationBar } from '@/components/ui/PaginationBar'
import { Spinner } from '@/components/ui/Spinner'
import { fetchWorkspacePayments, type WorkspacePayment } from '@/lib/organizerWorkspace'
import { formatPrice } from '@/lib/utils'

const channelLabels: Record<string, string> = {
  mp: 'Mercado Pago',
  cash: 'Efectivo',
  transfer: 'Transferencia',
}

const channelClass: Record<string, string> = {
  mp: 'bg-sky-50 text-sky-700',
  cash: 'bg-green-50 text-green-700',
  transfer: 'bg-violet-50 text-violet-700',
}

const statusLabels: Record<string, string> = {
  approved: 'Aprobado',
  pending: 'Pendiente',
  rejected: 'Rechazado',
  refunded: 'Reembolso',
}

const statusClass: Record<string, string> = {
  approved: 'bg-green-50 text-green-700',
  pending: 'bg-amber-50 text-amber-800',
  rejected: 'bg-red-50 text-red-700',
  refunded: 'bg-gray-100 text-gray-600',
}

const PAGE_SIZE = 20

function fmtDate(s: string | null | undefined) {
  if (!s) return '—'
  const d = new Date(s)
  return (
    d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })
    + ' '
    + d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
  )
}

export function PaymentsView({ eventId }: { eventId: string }) {
  const [rows, setRows] = useState<WorkspacePayment[]>([])
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ page: 1, page_size: PAGE_SIZE, total: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    const res = await fetchWorkspacePayments(eventId, { page, pageSize: PAGE_SIZE })
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
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch helper owns loading/error; intentional on mount/page change
    void load()
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
      <OrganizerToolHeading
        title="Pagos"
        description="Registros de cobro asociados a pedidos del evento."
      />

      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {rows.length === 0 ? (
          <div className="py-14 text-center px-4">
            <p className="text-sm font-medium text-gray-900 mb-1">Sin pagos registrados</p>
            <p className="text-xs text-gray-400">Los cobros del evento aparecerán acá.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[720px]">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Proveedor</th>
                  <th className="px-4 py-3">Canal</th>
                  <th className="px-4 py-3">Pedido</th>
                  <th className="px-4 py-3 text-right">Monto</th>
                  <th className="px-4 py-3 text-right">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {rows.map(row => {
                  const st = row.status
                  const stCls = statusClass[st] ?? 'bg-gray-100 text-gray-600'
                  const ch = row.channel ?? ''
                  const chCls = channelClass[ch] ?? 'bg-gray-100 text-gray-600'
                  return (
                    <tr key={row.id} className="text-gray-900 hover:bg-gray-50/80">
                      <td className="px-4 py-3 align-middle">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${stCls}`}>
                          {statusLabels[st] ?? st}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{row.provider ?? '—'}</td>
                      <td className="px-4 py-3 align-middle">
                        {ch ? (
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${chCls}`}>
                            {channelLabels[ch] ?? ch}
                          </span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-500 tracking-wide">
                        #{row.order_id.slice(0, 8).toUpperCase()}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums font-semibold text-gray-900">
                        {formatPrice(row.amount)}
                      </td>
                      <td className="px-4 py-3 text-right text-xs text-gray-500 tabular-nums whitespace-nowrap">
                        {fmtDate(row.paid_at || row.created_at)}
                      </td>
                    </tr>
                  )
                })}
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
