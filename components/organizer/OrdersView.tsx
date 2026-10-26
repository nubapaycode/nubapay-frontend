'use client'

import { Download, RotateCw, Search } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { Money, formatCount } from '@/components/organizer/dashboard/AnimatedNumber'
import { FilterChip, PAYMENT_CONFIG } from '@/components/organizer/dashboard/Panels'
import { OPEN_ORDER_EVENT } from '@/components/organizer/commandEvents'
import { BulkActionsBar } from '@/components/organizer/orders/BulkActionsBar'
import { FilterMenu } from '@/components/organizer/orders/FilterMenu'
import { OrderDetailSheet } from '@/components/organizer/orders/OrderDetailSheet'
import {
  PAY_LABEL,
  STATUS_TABS,
  initials,
  itemsSummary,
  relativeTime,
  scanInfo,
  statusUi,
  type StatusFilter,
} from '@/components/organizer/orders/orderUi'
import { ProductScanSummaryView } from '@/components/organizer/ProductScanSummaryView'
import { PaginationBar } from '@/components/ui/PaginationBar'
import {
  downloadOrdersCsv,
  fetchAllCategories,
  fetchWorkspaceOrder,
  fetchWorkspaceOrders,
  patchOrderStatus,
} from '@/lib/organizerWorkspace'
import type {
  DashboardPaymentKey,
  OrdersStatusCounts,
  OrdersSummary,
  PaginationMeta,
  WorkspaceCategory,
} from '@/lib/organizerWorkspace'
import { cn } from '@/lib/utils'
import type { Order } from '@/types'

const PAGE_SIZE = 20
const POLL_INTERVAL = 15_000

type OrdersTab = 'orders' | 'scans'

/** Columnas de la tabla de escritorio: header y filas comparten esta grilla. */
const ORDERS_GRID = 'md:grid-cols-[92px_minmax(150px,1.2fr)_minmax(160px,1.6fr)_104px_112px_128px_96px]'

type UrlState = {
  tab: OrdersTab
  status: StatusFilter
  payment: DashboardPaymentKey | null
  cats: string[]
  q: string
  orderId: string | null
}

function readUrlState(): Partial<UrlState> {
  if (typeof window === 'undefined') return {}
  const p = new URLSearchParams(window.location.search)
  const out: Partial<UrlState> = {}
  if (p.get('vista') === 'escaneos') out.tab = 'scans'
  const estado = p.get('estado')
  if (estado && STATUS_TABS.some(t => t.key === estado)) out.status = estado as StatusFilter
  const pago = p.get('pago')
  if (pago && PAYMENT_CONFIG.some(c => c.key === pago)) out.payment = pago as DashboardPaymentKey
  const cat = p.get('categoria')
  if (cat) out.cats = cat.split(',').filter(Boolean)
  const q = p.get('q')
  if (q) out.q = q
  const pedido = p.get('pedido')
  if (pedido) out.orderId = pedido
  return out
}

function writeUrlState(s: UrlState) {
  const p = new URLSearchParams(window.location.search)
  for (const k of ['vista', 'estado', 'pago', 'categoria', 'q', 'pedido']) p.delete(k)
  if (s.tab === 'scans') p.set('vista', 'escaneos')
  if (s.status !== 'all') p.set('estado', s.status)
  if (s.payment) p.set('pago', s.payment)
  if (s.cats.length) p.set('categoria', s.cats.join(','))
  if (s.q) p.set('q', s.q)
  if (s.orderId) p.set('pedido', s.orderId)
  const qs = p.toString()
  window.history.replaceState(window.history.state, '', `${window.location.pathname}${qs ? `?${qs}` : ''}`)
}

function ScanProgress({ order }: { order: Order }) {
  if (order.status === 'cancelled') return <span className="text-[12px] text-gray-300">—</span>
  const { units, redeemed } = scanInfo(order)
  const pct = redeemed != null ? (redeemed / Math.max(units, 1)) * 100 : 50
  const done = redeemed != null && redeemed >= units
  return (
    <div className="flex items-center gap-2" title={`${redeemed ?? '?'} de ${units} unidades retiradas`}>
      <div className="h-1.5 w-12 overflow-hidden rounded-full bg-gray-100">
        <div
          className={cn('h-full rounded-full', done ? 'bg-emerald-500' : redeemed ? 'bg-amber-400' : 'bg-transparent')}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={cn('text-[12px] tabular-nums', done ? 'text-gray-500' : 'text-gray-900')}>
        {redeemed ?? '?'}/{units}
      </span>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const st = statusUi(status)
  return (
    <span className={cn('inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold', st.badge)}>
      <span className={cn('size-1.5 rounded-full', st.dot)} aria-hidden />
      {st.label}
    </span>
  )
}

function OrdersSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white" aria-busy="true">
      <p className="sr-only">Cargando pedidos…</p>
      {Array.from({ length: 7 }, (_, i) => (
        <div key={i} className="flex items-center gap-4 border-t border-gray-100 px-4 py-4 first:border-t-0">
          <div className="h-3 w-8 animate-pulse rounded bg-gray-100" />
          <div className="size-7 animate-pulse rounded-full bg-gray-100" />
          <div className="h-3 flex-1 animate-pulse rounded bg-gray-100" />
          <div className="h-3 w-16 animate-pulse rounded bg-gray-100" />
        </div>
      ))}
    </div>
  )
}

export function OrdersView({ eventId }: { eventId: string }) {
  const [hydrated, setHydrated] = useState(false)
  const [tab, setTab] = useState<OrdersTab>('orders')
  const [scanRefresh, setScanRefresh] = useState(0)
  const [status, setStatus] = useState<StatusFilter>('all')
  const [payment, setPayment] = useState<DashboardPaymentKey | null>(null)
  const [cats, setCats] = useState<string[]>([])
  const [searchInput, setSearchInput] = useState('')
  const [searchQ, setSearchQ] = useState('')
  const [page, setPage] = useState(1)

  const [orders, setOrders] = useState<Order[]>([])
  const [pagination, setPagination] = useState<PaginationMeta>({ page: 1, page_size: PAGE_SIZE, total: 0 })
  const [statusCounts, setStatusCounts] = useState<OrdersStatusCounts | null>(null)
  const [summary, setSummary] = useState<OrdersSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)
  const [categories, setCategories] = useState<WorkspaceCategory[]>([])

  const [selectedId, setSelectedId] = useState<string | null>(null)
  /** Pedidos marcados con la casilla (acciones en lote). Se limpia al cambiar de página o filtro. */
  const [checked, setChecked] = useState<Set<string>>(new Set())
  const [exporting, setExporting] = useState(false)
  /** Pedido abierto por enlace que no está en la página actual. */
  const [externalOrder, setExternalOrder] = useState<Order | null>(null)
  const [newIds, setNewIds] = useState<Set<string>>(new Set())
  const seenIds = useRef<Set<string> | null>(null)
  const [now, setNow] = useState(() => Date.now())
  const searchRef = useRef<HTMLInputElement>(null)

  // Filtros desde la URL al montar.
  useEffect(() => {
    const s = readUrlState()
    queueMicrotask(() => {
      if (s.tab) setTab(s.tab)
      if (s.status) setStatus(s.status)
      if (s.payment) setPayment(s.payment)
      if (s.cats) setCats(s.cats)
      if (s.q) {
        setSearchInput(s.q)
        setSearchQ(s.q)
      }
      if (s.orderId) setSelectedId(s.orderId)
      setHydrated(true)
    })
  }, [])

  useEffect(() => {
    if (!hydrated) return
    writeUrlState({ tab, status, payment, cats, q: searchQ, orderId: selectedId })
  }, [hydrated, tab, status, payment, cats, searchQ, selectedId])

  useEffect(() => {
    const t = window.setTimeout(() => {
      setSearchQ(searchInput.trim())
      setPage(1)
    }, 350)
    return () => window.clearTimeout(t)
  }, [searchInput])

  // Reloj para las horas relativas ("hace 4 min").
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 30_000)
    return () => window.clearInterval(id)
  }, [])

  // El buscador ⌘K abre pedidos acá mismo sin recargar la página.
  useEffect(() => {
    const onOpen = (e: Event) => {
      const id = (e as CustomEvent<{ id: string }>).detail?.id
      if (!id) return
      setTab('orders')
      setExternalOrder(null)
      setSelectedId(id)
    }
    window.addEventListener(OPEN_ORDER_EVENT, onOpen)
    return () => window.removeEventListener(OPEN_ORDER_EVENT, onOpen)
  }, [])

  // "/" enfoca el buscador (como en GitHub / Linear).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null
      if (e.key !== '/' || (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable))) return
      e.preventDefault()
      searchRef.current?.focus()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  const load = useCallback(
    async (silent = false) => {
      if (silent) setRefreshing(true)
      else {
        setLoading(true)
        setChecked(new Set())
      }
      setError('')
      const res = await fetchWorkspaceOrders(eventId, {
        page,
        pageSize: PAGE_SIZE,
        paymentStatus: 'approved',
        q: searchQ || undefined,
        status: status === 'all' ? undefined : status,
        payment,
        categories: cats,
      })
      if (!res.ok) {
        setError(res.error)
        if (!silent) setOrders([])
      } else {
        // En los refrescos automáticos, los pedidos que no estaban antes se resaltan un momento.
        const prev = seenIds.current
        if (silent && prev) {
          const fresh = res.orders.filter(o => !prev.has(o.id)).map(o => o.id)
          if (fresh.length) setNewIds(new Set(fresh))
        }
        seenIds.current = new Set([...(prev ?? []), ...res.orders.map(o => o.id)])
        setOrders(res.orders)
        setPagination(res.pagination)
        setStatusCounts(res.statusCounts)
        setSummary(res.summary)
        setLastRefresh(new Date())
      }
      setLoading(false)
      setRefreshing(false)
    },
    [eventId, page, searchQ, status, payment, cats],
  )

  useEffect(() => {
    if (!hydrated) return
    const id = window.requestAnimationFrame(() => void load())
    return () => window.cancelAnimationFrame(id)
  }, [hydrated, load])

  useEffect(() => {
    if (!hydrated || tab !== 'orders') return
    const id = window.setInterval(() => void load(true), POLL_INTERVAL)
    return () => window.clearInterval(id)
  }, [hydrated, load, tab])

  useEffect(() => {
    void fetchAllCategories(eventId).then(res => {
      if (res.ok) setCategories(res.categories)
    })
  }, [eventId])

  const selectedOrder = useMemo(
    () => (selectedId ? orders.find(o => o.id === selectedId) ?? (externalOrder?.id === selectedId ? externalOrder : null) : null),
    [selectedId, orders, externalOrder],
  )

  // Un enlace a un pedido de otra página: se trae suelto.
  useEffect(() => {
    if (!selectedId || loading || orders.some(o => o.id === selectedId) || externalOrder?.id === selectedId) return
    let cancelled = false
    void fetchWorkspaceOrder(eventId, selectedId).then(res => {
      if (cancelled) return
      if (res.ok) setExternalOrder(res.order)
      else setSelectedId(null)
    })
    return () => {
      cancelled = true
    }
  }, [selectedId, loading, orders, externalOrder, eventId])

  const selectedIndex = selectedOrder ? orders.findIndex(o => o.id === selectedOrder.id) : -1

  const changeFilter = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v)
    setPage(1)
  }
  const setStatusF = changeFilter(setStatus)
  const setPaymentF = changeFilter(setPayment)
  const setCatsF = changeFilter(setCats)

  const handleCancelOrder = useCallback(
    async (order: Order) => {
      const res = await patchOrderStatus(eventId, order.id, 'cancelled')
      if (!res.ok) return res
      setOrders(prev => prev.map(o => (o.id === res.order.id ? res.order : o)))
      setExternalOrder(prev => (prev?.id === res.order.id ? res.order : prev))
      void load(true)
      return { ok: true as const }
    },
    [eventId, load],
  )

  const totalAll = statusCounts
    ? statusCounts.unredeemed + statusCounts.partially_delivered + statusCounts.delivered + statusCounts.cancelled
    : null
  const countFor = (k: StatusFilter) => (k === 'all' ? totalAll : statusCounts?.[k] ?? null)
  const currentFilters = {
    paymentStatus: 'approved',
    q: searchQ || undefined,
    status: status === 'all' ? undefined : status,
    payment,
    categories: cats,
  }

  const exportCsv = async (ids?: string[]) => {
    setExporting(true)
    const res = await downloadOrdersCsv(eventId, { ...currentFilters, ids })
    setExporting(false)
    if (!res.ok) setError(res.error)
  }

  const checkedOrders = orders.filter(o => checked.has(o.id))
  const allChecked = orders.length > 0 && checkedOrders.length === orders.length
  const toggleChecked = (id: string) =>
    setChecked(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const hasFilters = Boolean(searchQ || payment || cats.length || status !== 'all')
  const redeemPct = summary && summary.units ? Math.round((summary.redeemed_units / summary.units) * 100) : null

  return (
    <div className="mx-auto max-w-[1180px]">
      <style>{`
        @keyframes nb-pop { from { opacity: 0; transform: translateY(-4px) scale(0.98); } to { opacity: 1; transform: none; } }
        @keyframes nb-fade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes nb-sheet-in { from { opacity: 0; transform: translateX(24px); } to { opacity: 1; transform: none; } }
        @keyframes nb-sheet-up { from { transform: translateY(40px); opacity: 0; } to { transform: none; opacity: 1; } }
        @keyframes nb-swap { from { opacity: 0.4; transform: translateY(4px); } to { opacity: 1; transform: none; } }
        @keyframes nb-flash { 0%, 30% { background-color: #FEF9C3; } 100% { background-color: transparent; } }
        .nb-pop { animation: nb-pop 160ms ease-out both; transform-origin: top left; }
        .nb-fade { animation: nb-fade 200ms ease-out both; }
        .nb-sheet { animation: nb-sheet-up 280ms cubic-bezier(0.22,1,0.36,1) both; }
        @media (min-width: 768px) { .nb-sheet { animation-name: nb-sheet-in; } }
        .nb-swap { animation: nb-swap 220ms ease-out both; }
        .nb-flash { animation: nb-flash 2.6s ease-out both; }
        @media (prefers-reduced-motion: reduce) { .nb-pop, .nb-fade, .nb-sheet, .nb-swap, .nb-flash { animation: none; } }
      `}</style>

      {/* Encabezado */}
      <header className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-semibold tracking-tight text-gray-900">Pedidos</h1>
          <p className="mt-1 flex items-center gap-2 text-[13px] text-gray-400">
            {tab === 'orders' ? (
              <>
                <span className="relative flex size-2">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-60 motion-reduce:animate-none" />
                  <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
                </span>
                Se actualiza solo
                {lastRefresh && (
                  <span className="tabular-nums">
                    · {lastRefresh.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' })}
                  </span>
                )}
              </>
            ) : (
              'Comprados vs. escaneados por producto'
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div role="tablist" aria-label="Vista de pedidos" className="inline-flex rounded-xl bg-gray-100 p-1">
            {(
              [
                ['orders', 'Pedidos'],
                ['scans', 'Escaneos'],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={tab === key}
                onClick={() => {
                  setTab(key)
                  setSearchInput('')
                }}
                className={cn(
                  'rounded-lg px-3.5 py-1.5 text-[13px] font-semibold transition-colors',
                  tab === key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900',
                )}
              >
                {label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => (tab === 'orders' ? void load(true) : setScanRefresh(n => n + 1))}
            disabled={tab === 'orders' && (refreshing || loading)}
            aria-label="Actualizar"
            title="Actualizar"
            className="rounded-xl p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-900 disabled:opacity-50"
          >
            <RotateCw size={16} strokeWidth={1.75} className={refreshing ? 'animate-spin' : ''} />
          </button>
        </div>
      </header>

      {/* Pestañas de estado con conteo (vistas rápidas) */}
      {tab === 'orders' && (
        <div className="-mx-4 mb-4 overflow-x-auto px-4 md:mx-0 md:px-0">
          <div role="tablist" aria-label="Estado" className="flex min-w-max gap-1 border-b border-gray-200">
            {STATUS_TABS.map(t => {
              const active = status === t.key
              const n = countFor(t.key)
              return (
                <button
                  key={t.key}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setStatusF(t.key)}
                  className={cn(
                    'relative -mb-px flex items-center gap-2 border-b-2 px-3 pb-2.5 pt-1 text-[13px] transition-colors',
                    active ? 'border-gray-900 font-semibold text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-900',
                  )}
                >
                  {t.key !== 'all' && <span className={cn('size-1.5 rounded-full', statusUi(t.key === 'unredeemed' ? 'paid' : t.key).dot)} aria-hidden />}
                  {t.label}
                  {n != null && (
                    <span
                      className={cn(
                        'rounded-md px-1.5 text-[11px] font-semibold tabular-nums',
                        active ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500',
                      )}
                    >
                      {formatCount(n)}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Buscador y filtros */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search size={15} strokeWidth={1.75} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden />
          <input
            ref={searchRef}
            type="search"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Escape') {
                setSearchInput('')
                e.currentTarget.blur()
              }
            }}
            placeholder={tab === 'orders' ? 'Buscar por cliente, producto o nº de pedido…' : 'Buscar producto…'}
            className="h-9 w-full rounded-xl border border-gray-200 bg-white pl-9 pr-10 text-[13px] text-gray-900 shadow-[0_1px_2px_rgba(16,24,40,0.04)] transition-[border-color,box-shadow] placeholder:text-gray-400 focus:border-gray-400 focus:shadow-[0_0_0_3px_rgba(17,24,39,0.06)] focus:outline-none"
          />
          {!searchInput && (
            <kbd className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md border border-gray-200 px-1.5 font-sans text-[10px] font-semibold text-gray-400">
              /
            </kbd>
          )}
        </div>
        {tab === 'orders' && (
          <>
            <FilterMenu
              label="Pago"
              options={PAYMENT_CONFIG.map(p => ({ value: p.key, label: p.label, swatch: p.color }))}
              selected={payment ? [payment] : []}
              onChange={v => setPaymentF((v[0] as DashboardPaymentKey | undefined) ?? null)}
            />
            {categories.length > 0 && (
              <FilterMenu
                label="Categoría"
                multiple
                options={categories.map(c => ({ value: c.name, label: c.name }))}
                selected={cats}
                onChange={setCatsF}
              />
            )}
            <button
              type="button"
              onClick={() => void exportCsv()}
              disabled={exporting || pagination.total === 0}
              title="Descargar los pedidos de este filtro en CSV (Excel / Sheets)"
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 text-[13px] font-medium text-gray-700 shadow-[0_1px_2px_rgba(16,24,40,0.04)] transition-colors hover:bg-gray-50 hover:text-gray-900 disabled:opacity-50"
            >
              <Download size={14} strokeWidth={1.75} className={exporting ? 'animate-bounce' : ''} aria-hidden />
              {exporting ? 'Exportando…' : 'Exportar'}
            </button>
          </>
        )}
      </div>

      {tab === 'orders' && (payment || cats.length > 0) && (
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {payment && <FilterChip label="Pago" value={PAY_LABEL[payment]} onClear={() => setPaymentF(null)} />}
          {cats.map(c => (
            <FilterChip key={c} label="Categoría" value={c} onClear={() => setCatsF(cats.filter(x => x !== c))} />
          ))}
          <button
            type="button"
            onClick={() => {
              setPaymentF(null)
              setCatsF([])
            }}
            className="px-1 text-[12px] font-medium text-gray-400 transition-colors hover:text-gray-900"
          >
            Limpiar filtros
          </button>
        </div>
      )}

      {tab === 'scans' && <ProductScanSummaryView key={scanRefresh} eventId={eventId} embedded query={searchInput} />}

      {tab === 'orders' && (
        <>
          {/* Totales del filtro actual (Mercury) */}
          {summary && !loading && (
            <div className="mb-3 flex flex-wrap items-center gap-x-5 gap-y-1 px-1 text-[13px] text-gray-500">
              <span>
                <span className="font-semibold tabular-nums text-gray-900">{formatCount(pagination.total)}</span>{' '}
                {pagination.total === 1 ? 'pedido' : 'pedidos'}
              </span>
              <span>
                <Money value={summary.revenue} className="font-semibold tabular-nums text-gray-900" /> cobrado
              </span>
              {redeemPct != null && (
                <span className="flex items-center gap-2">
                  <span className="h-1.5 w-16 overflow-hidden rounded-full bg-gray-100">
                    <span className="block h-full rounded-full bg-emerald-500" style={{ width: `${redeemPct}%` }} />
                  </span>
                  <span>
                    <span className="font-semibold tabular-nums text-gray-900">{redeemPct}%</span> retirado
                    <span className="tabular-nums text-gray-400">
                      {' '}
                      ({formatCount(summary.redeemed_units)} de {formatCount(summary.units)} u.)
                    </span>
                  </span>
                </span>
              )}
            </div>
          )}

          {error && (
            <div className="mb-3 rounded-xl border border-red-100 bg-red-50/70 px-4 py-2.5 text-[13px] text-red-700">{error}</div>
          )}

          {loading ? (
            <OrdersSkeleton />
          ) : orders.length === 0 ? (
            <div className="rounded-2xl border border-gray-200/80 bg-white px-6 py-16 text-center">
              <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl bg-gray-50">
                <Search size={20} strokeWidth={1.5} className="text-gray-300" aria-hidden />
              </div>
              <p className="text-[15px] font-semibold text-gray-900">Sin pedidos</p>
              <p className="mt-1 text-[13px] text-gray-400">
                {hasFilters ? 'Probá otra búsqueda o quitá filtros.' : 'Los pedidos pagados aparecerán acá.'}
              </p>
            </div>
          ) : (
            <div className={cn('relative overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)] transition-opacity', refreshing && 'opacity-80')}>
              {/* Encabezado de la tabla (escritorio) */}
              <div className={cn('hidden gap-3 border-b border-gray-100 bg-gray-50/70 px-4 py-2.5 text-[11px] font-medium text-gray-400 md:grid', ORDERS_GRID)}>
                <span className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    aria-label="Seleccionar todos los pedidos de la página"
                    checked={allChecked}
                    ref={el => {
                      if (el) el.indeterminate = checkedOrders.length > 0 && !allChecked
                    }}
                    onChange={() => setChecked(allChecked ? new Set() : new Set(orders.map(o => o.id)))}
                    className="size-4 cursor-pointer rounded border-gray-300 accent-gray-900"
                  />
                  #
                </span>
                <span>Cliente</span>
                <span>Productos</span>
                <span>Retiro</span>
                <span className="text-right">Total</span>
                <span>Estado</span>
                <span className="text-right">Hora</span>
              </div>
              <ul>
                {orders.map(order => {
                  const selected = order.id === selectedId
                  const payColor = PAYMENT_CONFIG.find(p => p.key === order.paymentMethod)?.color
                  const open = () => {
                    setExternalOrder(null)
                    setSelectedId(order.id)
                  }
                  return (
                    <li key={order.id} className="border-t border-gray-100 first:border-t-0">
                      {/* Toda la fila abre el detalle con el mouse; el nº de pedido es el botón para teclado y lectores. */}
                      <div
                        onClick={open}
                        aria-current={selected || undefined}
                        className={cn(
                          'relative grid cursor-pointer grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1.5 px-4 py-3.5 transition-colors md:gap-y-0 md:py-3',
                          ORDERS_GRID,
                          selected ? 'bg-gray-50' : checked.has(order.id) ? 'bg-gray-50/60' : 'hover:bg-gray-50/70',
                          newIds.has(order.id) && 'nb-flash',
                        )}
                      >
                        {selected && <span className="absolute inset-y-0 left-0 w-0.5 bg-gray-900" aria-hidden />}

                        {/* # */}
                        <span className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            aria-label={`Seleccionar pedido ${order.orderNumber != null ? `#${order.orderNumber}` : ''}`.trim()}
                            checked={checked.has(order.id)}
                            onClick={e => e.stopPropagation()}
                            onChange={() => toggleChecked(order.id)}
                            className="size-4 shrink-0 cursor-pointer rounded border-gray-300 accent-gray-900"
                          />
                          <button
                            type="button"
                            onClick={e => {
                              e.stopPropagation()
                              open()
                            }}
                            aria-label={`Ver detalle del pedido ${order.orderNumber != null ? `#${order.orderNumber}` : ''}`.trim()}
                            className="rounded text-[13px] font-semibold tabular-nums text-gray-900 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-gray-900/20"
                          >
                            {order.orderNumber != null ? `#${order.orderNumber}` : '—'}
                          </button>
                          <span className="text-[13px] text-gray-400 md:hidden">{relativeTime(order.createdAt, now)}</span>
                        </span>

                        {/* Estado en mobile va arriba a la derecha */}
                        <span className="justify-self-end md:hidden">
                          <StatusBadge status={order.status} />
                        </span>

                        {/* Cliente */}
                        <div className="col-span-2 flex min-w-0 items-center gap-2.5 md:col-span-1">
                          <span
                            className="hidden size-7 shrink-0 items-center justify-center rounded-full bg-gray-100 text-[11px] font-semibold text-gray-500 md:flex"
                            aria-hidden
                          >
                            {initials(order.customerName)}
                          </span>
                          <div className="min-w-0">
                            <p className={cn('truncate text-[13px] font-medium', order.customerName ? 'text-gray-900' : 'text-gray-300')}>
                              {order.customerName || 'Sin nombre'}
                            </p>
                            {order.customerEmail && <p className="truncate text-[11px] text-gray-400">{order.customerEmail}</p>}
                          </div>
                        </div>

                        {/* Productos */}
                        <div className="col-span-2 min-w-0 md:col-span-1">
                          <p className="truncate text-[13px] text-gray-600" title={itemsSummary(order)}>
                            {itemsSummary(order)}
                          </p>
                        </div>

                        {/* Retiro */}
                        <div>
                          <ScanProgress order={order} />
                        </div>

                        {/* Total */}
                        <div className="flex items-center justify-end gap-2">
                          {payColor && (
                            <span
                              className="size-2 shrink-0 rounded-[3px]"
                              style={{ backgroundColor: payColor }}
                              title={PAY_LABEL[order.paymentMethod ?? ''] ?? ''}
                              aria-label={PAY_LABEL[order.paymentMethod ?? ''] ?? undefined}
                            />
                          )}
                          <Money
                            value={order.total}
                            className={cn(
                              'text-[13px] font-semibold tabular-nums',
                              order.status === 'cancelled' ? 'text-gray-400 line-through' : 'text-gray-900',
                            )}
                          />
                        </div>

                        {/* Estado (escritorio) */}
                        <span className="hidden md:block">
                          <StatusBadge status={order.status} />
                        </span>

                        {/* Hora (escritorio) */}
                        <span className="hidden whitespace-nowrap text-right text-[12px] tabular-nums text-gray-400 md:block" title={new Date(order.createdAt).toLocaleString('es-AR')}>
                          {relativeTime(order.createdAt, now)}
                        </span>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}

          {!loading && pagination.total > PAGE_SIZE && (
            <div className="mt-5 flex justify-center">
              <PaginationBar page={page} pageSize={PAGE_SIZE} total={pagination.total} onPageChange={setPage} />
            </div>
          )}

          {!loading && orders.length > 0 && (
            <p className="mt-3 hidden text-center text-[11px] text-gray-400 md:block">
              Tocá un pedido para ver el detalle · ↑ ↓ para recorrerlos · <kbd className="font-sans">/</kbd> para buscar
            </p>
          )}
        </>
      )}

      {tab === 'orders' && checkedOrders.length > 0 && (
        <BulkActionsBar
          orders={checkedOrders}
          exporting={exporting}
          onExport={() => void exportCsv(checkedOrders.map(o => o.id))}
          onClear={() => setChecked(new Set())}
          onCancel={async target => {
            const failed: string[] = []
            for (const o of target) {
              const res = await patchOrderStatus(eventId, o.id, 'cancelled')
              if (!res.ok) failed.push(`#${o.orderNumber ?? '—'}: ${res.error}`)
            }
            // La selección queda para que la barra muestre el resultado; "Listo" la limpia.
            void load(true)
            return failed
          }}
        />
      )}

      {selectedOrder && (
        <OrderDetailSheet
          order={selectedOrder}
          onClose={() => {
            setSelectedId(null)
            setExternalOrder(null)
          }}
          onPrev={selectedIndex > 0 ? () => setSelectedId(orders[selectedIndex - 1].id) : undefined}
          onNext={selectedIndex >= 0 && selectedIndex < orders.length - 1 ? () => setSelectedId(orders[selectedIndex + 1].id) : undefined}
          onCancelOrder={handleCancelOrder}
        />
      )}
    </div>
  )
}
