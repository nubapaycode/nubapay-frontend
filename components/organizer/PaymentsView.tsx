'use client'

import { ArrowUpRight, CreditCard, Search } from 'lucide-react'
import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'

import { Money, formatCount } from '@/components/organizer/dashboard/AnimatedNumber'
import { FilterChip, PAYMENT_CONFIG } from '@/components/organizer/dashboard/Panels'
import { FilterMenu } from '@/components/organizer/orders/FilterMenu'
import { relativeTime } from '@/components/organizer/orders/orderUi'
import { PaginationBar } from '@/components/ui/PaginationBar'
import {
  fetchWorkspacePayments,
  type PaymentsSort,
  type PaymentsSummary,
  type WorkspacePayment,
} from '@/lib/organizerWorkspace'
import { cn } from '@/lib/utils'

const PAGE_SIZE = 20

const STATUS_UI: Record<string, { label: string; badge: string; dot: string }> = {
  approved: { label: 'Aprobado', badge: 'bg-emerald-50 text-emerald-800', dot: 'bg-emerald-500' },
  pending: { label: 'Pendiente', badge: 'bg-amber-50 text-amber-800', dot: 'bg-amber-400' },
  rejected: { label: 'Rechazado', badge: 'bg-red-50 text-red-700', dot: 'bg-red-400' },
  refunded: { label: 'Reembolso', badge: 'bg-gray-100 text-gray-600', dot: 'bg-gray-400' },
}

const SORT_OPTIONS: { value: PaymentsSort; label: string }[] = [
  { value: 'date_desc', label: 'Más recientes' },
  { value: 'date_asc', label: 'Más antiguos' },
  { value: 'amount_desc', label: 'Monto mayor' },
  { value: 'amount_asc', label: 'Monto menor' },
]

/** Nombre del proveedor como lo reconoce el organizador ("sipago" → "SiPago"). */
function providerLabel(provider: string | null | undefined) {
  const p = (provider ?? '').toLowerCase()
  if (!p) return ''
  if (p.includes('mercado') || p === 'mp') return 'Mercado Pago'
  if (p === 'sipago') return 'SiPago'
  if (p === 'cash' || p === 'efectivo') return 'Efectivo'
  if (p === 'transfer') return 'Transferencia'
  return provider ?? ''
}

function PaymentsSkeleton() {
  return (
    <div aria-busy="true">
      <p className="sr-only">Cargando pagos…</p>
      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        {[0, 1, 2].map(i => (
          <div key={i} className="h-[88px] animate-pulse rounded-2xl bg-gray-100" />
        ))}
      </div>
      <div className="h-80 animate-pulse rounded-2xl bg-gray-100" />
    </div>
  )
}

export function PaymentsView({ eventId }: { eventId: string }) {
  const [rows, setRows] = useState<WorkspacePayment[]>([])
  const [summary, setSummary] = useState<PaymentsSummary | null>(null)
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ page: 1, page_size: PAGE_SIZE, total: 0 })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [now, setNow] = useState(() => Date.now())

  const [searchInput, setSearchInput] = useState('')
  const [q, setQ] = useState('')
  const [statusFilter, setStatusFilter] = useState<string[]>([])
  const [channelFilter, setChannelFilter] = useState<string[]>([])
  const [sort, setSort] = useState<PaymentsSort>('date_desc')

  useEffect(() => {
    const t = window.setTimeout(() => {
      setQ(searchInput.trim())
      setPage(1)
    }, 350)
    return () => window.clearTimeout(t)
  }, [searchInput])

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 30_000)
    return () => window.clearInterval(id)
  }, [])

  // Todos los filtros y el orden se aplican en el servidor (antes solo filtraban la página cargada).
  const load = useCallback(async () => {
    setRefreshing(true)
    setError('')
    const res = await fetchWorkspacePayments(eventId, {
      page,
      pageSize: PAGE_SIZE,
      status: statusFilter,
      channels: channelFilter,
      q,
      sort,
    })
    if (!res.ok) {
      setError(res.error)
      setRows([])
    } else {
      setRows(res.payments)
      setPagination(res.pagination)
      setSummary(res.summary)
    }
    setLoading(false)
    setRefreshing(false)
  }, [eventId, page, statusFilter, channelFilter, q, sort])

  useEffect(() => {
    const id = window.requestAnimationFrame(() => void load())
    return () => window.cancelAnimationFrame(id)
  }, [load])

  const withPageReset = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v)
    setPage(1)
  }
  const setStatusF = withPageReset(setStatusFilter)
  const setChannelF = withPageReset(setChannelFilter)
  const setSortF = withPageReset(setSort)

  const hasFilters = Boolean(q || statusFilter.length || channelFilter.length)
  const ordersHref = (orderId: string) => `/events/${eventId}/orders?pedido=${orderId}`

  if (loading) return <PaymentsSkeleton />

  const cards: { key: 'approved' | 'pending' | 'rejected'; label: string; hint: string }[] = [
    { key: 'approved', label: 'Cobrado', hint: 'pagos aprobados' },
    { key: 'pending', label: 'Pendiente', hint: 'esperando confirmación' },
    { key: 'rejected', label: 'Rechazado', hint: 'no se cobraron' },
  ]

  return (
    <div className="mx-auto w-full max-w-[1180px]">
      <style>{`
        @keyframes nb-pop { from { opacity: 0; transform: translateY(-4px) scale(0.98); } to { opacity: 1; transform: none; } }
        .nb-pop { animation: nb-pop 160ms ease-out both; transform-origin: top left; }
        @media (prefers-reduced-motion: reduce) { .nb-pop { animation: none; } }
      `}</style>

      <header className="mb-5">
        <h1 className="text-[26px] font-semibold tracking-tight text-gray-900">Pagos</h1>
        <p className="mt-1 text-[13px] text-gray-500">Cada cobro del evento, con su estado y el pedido al que pertenece.</p>
      </header>

      {/* Resumen por estado: cada tarjeta filtra la tabla */}
      {summary && (
        <div className="mb-5 grid gap-3 sm:grid-cols-3">
          {cards.map(c => {
            const s = summary[c.key]
            const active = statusFilter.length === 1 && statusFilter[0] === c.key
            return (
              <button
                key={c.key}
                type="button"
                aria-pressed={active}
                onClick={() => setStatusF(active ? [] : [c.key])}
                className={cn(
                  'rounded-2xl border bg-white p-4 text-left shadow-[0_1px_2px_rgba(16,24,40,0.04)] transition-[border-color,box-shadow]',
                  active ? 'border-gray-900 ring-1 ring-gray-900' : 'border-gray-200/80 hover:border-gray-300',
                )}
              >
                <span className="flex items-center gap-2 text-[12px] font-medium text-gray-500">
                  <span className={cn('size-1.5 rounded-full', STATUS_UI[c.key].dot)} aria-hidden />
                  {c.label}
                </span>
                <Money value={s.amount} className="mt-1.5 block text-[22px] font-semibold tracking-tight tabular-nums text-gray-900" />
                <span className="mt-0.5 block text-[12px] text-gray-400">
                  {formatCount(s.count)} {s.count === 1 ? 'pago' : 'pagos'} · {c.hint}
                </span>
              </button>
            )
          })}
        </div>
      )}

      {/* Buscador y filtros */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search size={15} strokeWidth={1.75} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden />
          <input
            type="search"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder="Buscar por nº de pedido o cliente…"
            aria-label="Buscar pagos"
            className="h-9 w-full rounded-xl border border-gray-200 bg-white pl-9 pr-3 text-[13px] text-gray-900 shadow-[0_1px_2px_rgba(16,24,40,0.04)] outline-none transition-[border-color,box-shadow] placeholder:text-gray-400 focus:border-gray-400 focus:shadow-[0_0_0_3px_rgba(17,24,39,0.06)]"
          />
        </div>
        <FilterMenu
          label="Estado"
          multiple
          options={Object.entries(STATUS_UI).map(([value, s]) => ({ value, label: s.label }))}
          selected={statusFilter}
          onChange={setStatusF}
        />
        <FilterMenu
          label="Medio"
          multiple
          options={PAYMENT_CONFIG.map(p => ({ value: p.key, label: p.label, swatch: p.color }))}
          selected={channelFilter}
          onChange={setChannelF}
        />
        <label className="relative">
          <span className="sr-only">Ordenar</span>
          <select
            value={sort}
            onChange={e => setSortF(e.target.value as PaymentsSort)}
            className="h-9 appearance-none rounded-xl border border-gray-200 bg-white pl-3 pr-8 text-[13px] font-medium text-gray-700 shadow-[0_1px_2px_rgba(16,24,40,0.04)] outline-none hover:border-gray-300 focus:border-gray-400"
          >
            {SORT_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-400" aria-hidden>
            ▼
          </span>
        </label>
      </div>

      {(statusFilter.length > 0 || channelFilter.length > 0) && (
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {statusFilter.map(s => (
            <FilterChip key={s} label="Estado" value={STATUS_UI[s]?.label ?? s} onClear={() => setStatusF(statusFilter.filter(x => x !== s))} />
          ))}
          {channelFilter.map(c => (
            <FilterChip
              key={c}
              label="Medio"
              value={PAYMENT_CONFIG.find(p => p.key === c)?.label ?? c}
              onClear={() => setChannelF(channelFilter.filter(x => x !== c))}
            />
          ))}
        </div>
      )}

      {error && <div className="mb-3 rounded-xl border border-red-100 bg-red-50/70 px-4 py-2.5 text-[13px] text-red-700">{error}</div>}

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-gray-200/80 bg-white px-6 py-14 text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl bg-gray-50 text-gray-400">
            <CreditCard size={22} strokeWidth={1.5} aria-hidden />
          </div>
          <p className="text-[15px] font-semibold text-gray-900">{hasFilters ? 'Sin resultados' : 'Sin pagos registrados'}</p>
          <p className="mt-1 text-[13px] text-gray-500">
            {hasFilters ? 'Probá con otros filtros.' : 'Los cobros del evento aparecerán acá una vez que se procesen.'}
          </p>
        </div>
      ) : (
        <div className={cn('overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)] transition-opacity', refreshing && 'opacity-70')}>
          <div className="hidden grid-cols-[120px_minmax(160px,1fr)_minmax(150px,1fr)_120px_110px] gap-3 border-b border-gray-100 bg-gray-50/70 px-4 py-2.5 text-[11px] font-medium text-gray-400 md:grid">
            <span>Estado</span>
            <span>Pedido</span>
            <span>Medio</span>
            <span className="text-right">Monto</span>
            <span className="text-right">Fecha</span>
          </div>
          <ul className="divide-y divide-gray-100">
            {rows.map(row => {
              const st = STATUS_UI[row.status] ?? { label: row.status, badge: 'bg-gray-100 text-gray-600', dot: 'bg-gray-400' }
              const ch = PAYMENT_CONFIG.find(p => p.key === row.channel)
              const provider = providerLabel(row.provider)
              const when = row.paid_at || row.created_at
              return (
                <li key={row.id}>
                  <Link
                    href={ordersHref(row.order_id)}
                    className="group grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1 px-4 py-3 transition-colors hover:bg-gray-50/70 md:grid-cols-[120px_minmax(160px,1fr)_minmax(150px,1fr)_120px_110px] md:gap-y-0"
                  >
                    <span>
                      <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold', st.badge)}>
                        <span className={cn('size-1.5 rounded-full', st.dot)} aria-hidden />
                        {st.label}
                      </span>
                    </span>
                    <span className="justify-self-end text-right md:hidden">
                      <Money
                        value={row.amount}
                        className={cn('text-[14px] font-semibold tabular-nums', row.status === 'rejected' ? 'text-gray-400 line-through' : 'text-gray-900')}
                      />
                    </span>
                    <span className="min-w-0">
                      <span className="flex items-center gap-1 text-[13px] font-semibold text-gray-900">
                        {row.order_number != null ? `#${row.order_number}` : `#${row.order_id.slice(0, 8).toUpperCase()}`}
                        <ArrowUpRight size={13} strokeWidth={2} className="text-gray-300 transition-colors group-hover:text-gray-900" aria-hidden />
                      </span>
                      {row.customer_name && <span className="block truncate text-[12px] text-gray-500">{row.customer_name}</span>}
                    </span>
                    <span className="flex min-w-0 items-center gap-2 text-[13px] text-gray-700 max-md:justify-self-end">
                      {ch && <span className="size-2.5 shrink-0 rounded-[3px]" style={{ backgroundColor: ch.color }} aria-hidden />}
                      <span className="truncate">
                        {ch?.label ?? '—'}
                        {provider && provider !== ch?.label && <span className="text-gray-400"> · {provider}</span>}
                      </span>
                    </span>
                    <span className="hidden text-right md:block">
                      <Money
                        value={row.amount}
                        className={cn('text-[13px] font-semibold tabular-nums', row.status === 'rejected' ? 'text-gray-400 line-through' : 'text-gray-900')}
                      />
                    </span>
                    <span
                      className="col-span-2 whitespace-nowrap text-[12px] tabular-nums text-gray-400 md:col-span-1 md:text-right"
                      title={when ? new Date(when).toLocaleString('es-AR', { hourCycle: 'h23' }) : undefined}
                    >
                      {when ? relativeTime(when, now) : '—'}
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {pagination.total > PAGE_SIZE && (
        <div className="mt-5 flex justify-center">
          <PaginationBar page={pagination.page} pageSize={pagination.page_size} total={pagination.total} onPageChange={setPage} />
        </div>
      )}
    </div>
  )
}
