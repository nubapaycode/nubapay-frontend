'use client'

import { ChevronRight, Undo2 } from 'lucide-react'
import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'

import { fullDateTime, initials } from '@/components/organizer/orders/orderUi'
import { OrganizerToolHeading } from '@/components/organizer/OrganizerToolHeading'
import { PaginationBar } from '@/components/ui/PaginationBar'
import { fetchRegrets, type PaginationMeta, type RegretStatus, type WorkspaceRegret } from '@/lib/organizerWorkspace'
import { cn } from '@/lib/utils'

const PAGE_SIZE = 30

type Filter = RegretStatus | 'all'

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'pending', label: 'Pendientes' },
  { key: 'resolved', label: 'Gestionados' },
  { key: 'all', label: 'Todos' },
]

export function RegretStatusBadge({ status }: { status: RegretStatus }) {
  const resolved = status === 'resolved'
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium',
        resolved ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800',
      )}
    >
      <span className={cn('size-1.5 rounded-full', resolved ? 'bg-emerald-500' : 'bg-amber-400')} aria-hidden />
      {resolved ? 'Gestionado' : 'Pendiente'}
    </span>
  )
}

/** Herramienta "Arrepentimientos": solicitudes que los compradores envían desde el botón del catálogo. */
export function RegretsView({ eventId }: { eventId: string }) {
  const basePath = `/events/${eventId}/arrepentimientos`
  const [filter, setFilter] = useState<Filter>('pending')
  const [page, setPage] = useState(1)
  const [regrets, setRegrets] = useState<WorkspaceRegret[]>([])
  const [pagination, setPagination] = useState<PaginationMeta | null>(null)
  const [pendingCount, setPendingCount] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetchRegrets(eventId, {
        page,
        pageSize: PAGE_SIZE,
        status: filter === 'all' ? undefined : filter,
      })
      if (!res.ok) {
        setError(res.error)
        return
      }
      setRegrets(res.regrets)
      setPagination(res.pagination)
      setPendingCount(res.pendingCount)
    } catch {
      setError('No se pudieron cargar los arrepentimientos')
    } finally {
      setLoading(false)
    }
  }, [eventId, page, filter])

  useEffect(() => {
    const id = window.requestAnimationFrame(() => void load())
    return () => window.cancelAnimationFrame(id)
  }, [load])

  return (
    <div className="mx-auto w-full max-w-[860px]">
      <OrganizerToolHeading
        title="Arrepentimientos"
        description="Solicitudes de compradores que se arrepintieron de su compra."
      />

      <div className="mb-4 flex flex-wrap gap-1.5" role="tablist" aria-label="Filtrar por estado">
        {FILTERS.map(f => (
          <button
            key={f.key}
            type="button"
            role="tab"
            aria-selected={filter === f.key}
            onClick={() => {
              setFilter(f.key)
              setPage(1)
            }}
            className={cn(
              'rounded-full px-3 py-1.5 text-[13px] font-medium transition-colors',
              filter === f.key ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
            )}
          >
            {f.label}
            {f.key === 'pending' && pendingCount ? (
              <span className={cn('ml-1.5 tabular-nums', filter === f.key ? 'text-white/70' : 'text-gray-400')}>
                {pendingCount}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {error && (
        <p role="alert" className="mb-3 rounded-xl bg-red-50 px-4 py-3 text-[13px] text-red-700">
          {error}
        </p>
      )}

      {loading && regrets.length === 0 ? (
        <div className="space-y-2" aria-busy="true">
          {[0, 1, 2].map(i => (
            <div key={i} className="h-[68px] animate-pulse rounded-2xl bg-gray-100" />
          ))}
        </div>
      ) : regrets.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-gray-200 px-6 py-14 text-center">
          <div className="mb-3 flex size-11 items-center justify-center rounded-xl bg-gray-100 text-gray-400">
            <Undo2 size={20} strokeWidth={1.75} aria-hidden />
          </div>
          <p className="text-[15px] font-semibold text-gray-900">
            {filter === 'pending' ? 'No hay arrepentimientos pendientes' : 'Todavía no hay arrepentimientos'}
          </p>
          <p className="mt-1 text-[13px] text-gray-500">
            Cuando un comprador use el botón de arrepentimiento del catálogo, la solicitud va a aparecer acá.
          </p>
        </div>
      ) : (
        <ul className={cn('space-y-2 transition-opacity', loading && 'opacity-60')}>
          {regrets.map(r => (
            <li key={r.id}>
              <Link
                href={`${basePath}/${r.id}`}
                className="group flex items-center gap-3.5 rounded-2xl border border-gray-200/80 bg-white px-4 py-3.5 shadow-[0_1px_2px_rgba(16,24,40,0.04)] transition-[border-color,box-shadow] hover:border-gray-300 hover:shadow-[0_6px_20px_-8px_rgba(16,24,40,0.18)]"
              >
                <span
                  className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-[13px] font-semibold text-gray-600"
                  aria-hidden
                >
                  {initials(r.fullName)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14px] font-semibold text-gray-900">{r.fullName}</span>
                  <span className="block truncate text-[12px] text-gray-500">{r.email}</span>
                </span>
                <span className="hidden shrink-0 text-right sm:block">
                  <span className="block text-[12px] text-gray-500">{fullDateTime(r.createdAt)}</span>
                  <span className="block text-[12px] text-gray-400">
                    {r.orderCount
                      ? `${r.orderCount} ${r.orderCount === 1 ? 'pedido' : 'pedidos'}`
                      : 'Sin pedidos asociados'}
                  </span>
                </span>
                <RegretStatusBadge status={r.status} />
                <ChevronRight
                  size={16}
                  className="shrink-0 text-gray-300 transition-[color,transform] group-hover:translate-x-0.5 group-hover:text-gray-600"
                  aria-hidden
                />
              </Link>
            </li>
          ))}
        </ul>
      )}

      {pagination && pagination.total > PAGE_SIZE && (
        <PaginationBar
          className="mt-5"
          page={pagination.page}
          pageSize={pagination.page_size}
          total={pagination.total}
          onPageChange={setPage}
        />
      )}
    </div>
  )
}
