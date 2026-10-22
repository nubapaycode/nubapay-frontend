'use client'

import { Download, Search, X } from 'lucide-react'
import { useCallback, useState } from 'react'

import { fmtDateTime } from './format'
import { EmptyState, ErrorNote, Btn, Card, Pager, Pill, Select, Skeleton, Table, Td, Th, Toggle, cx, inputAutoCls, inputCls, useAsync, useDebounced, usePageForKey, useToast, OrderStatusPill, PaymentStatusPill } from './ui'
import { ORDER_STATUS_LABEL, PAYMENT_STATUS_LABEL } from './theme'
import { downloadOrdersCsv, fetchPlatformOrdersFiltered, type OrderFilters } from '@/lib/platformAdmin'
import { formatPrice } from '@/lib/utils'

const PAGE_SIZE = 25

const STATUS_OPTIONS = [
  { value: '', label: 'Todos los estados' },
  ...Object.entries(ORDER_STATUS_LABEL).map(([value, label]) => ({ value, label })),
]
const PAY_OPTIONS = [
  { value: '', label: 'Todos los pagos' },
  ...['pending', 'approved', 'rejected', 'refunded'].map((value) => ({ value, label: PAYMENT_STATUS_LABEL[value] })),
]
const SORT_OPTIONS = [
  { value: '', label: 'Más recientes' },
  { value: 'oldest', label: 'Más antiguas' },
  { value: 'total_desc', label: 'Mayor monto' },
  { value: 'total_asc', label: 'Menor monto' },
]

export function OrdersTab({
  initialQuery,
  initialEventId,
  onOpenOrder,
  refreshKey,
}: {
  initialQuery?: string
  initialEventId?: string
  onOpenOrder: (orderId: string) => void
  /** Se incrementa cuando una acción del drawer cambió una orden. */
  refreshKey: number
}) {
  const toast = useToast()
  const [q, setQ] = useState(initialQuery ?? '')
  const [status, setStatus] = useState('')
  const [pay, setPay] = useState('')
  const [sort, setSort] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [includeTest, setIncludeTest] = useState(false)
  const [eventId, setEventId] = useState(initialEventId ?? '')
  const [exporting, setExporting] = useState(false)

  const dq = useDebounced(q, 300)

  const filters: OrderFilters = {
    q: dq.trim() || undefined,
    status: status || undefined,
    payment_status: pay || undefined,
    sort: sort || undefined,
    from: from || undefined,
    to: to || undefined,
    event_id: eventId || undefined,
    include_test: includeTest,
  }
  const key = JSON.stringify(filters)
  const [page, setPage] = usePageForKey(key)
  const load = useCallback(() => fetchPlatformOrdersFiltered(page, PAGE_SIZE, filters), [page, key]) // eslint-disable-line react-hooks/exhaustive-deps
  const { data, error, loading, reload } = useAsync(load, [load, refreshKey])
  const orders = data?.orders ?? []

  const hasFilters = !!(q || status || pay || sort || from || to || eventId || includeTest)
  function clear() {
    setQ('')
    setStatus('')
    setPay('')
    setSort('')
    setFrom('')
    setTo('')
    setEventId('')
    setIncludeTest(false)
  }

  async function exportCsv() {
    setExporting(true)
    const r = await downloadOrdersCsv(filters)
    setExporting(false)
    if (!r.ok) toast('error', r.error)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[240px] flex-1">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/35" />
          <input
            aria-label="Buscar órdenes"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Email, nombre, # de orden, ID de orden o de pago…"
            className={cx(inputCls, 'pl-9')}
          />
        </div>
        <Select label="Estado" value={status} onChange={setStatus} options={STATUS_OPTIONS} className="w-auto" />
        <Select label="Pago" value={pay} onChange={setPay} options={PAY_OPTIONS} className="w-auto" />
        <Select label="Orden" value={sort} onChange={setSort} options={SORT_OPTIONS} className="w-auto" />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap items-center gap-2 text-xs text-white/45">
          Desde
          <input aria-label="Desde" type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={cx(inputAutoCls, 'py-1.5')} />
          hasta
          <input aria-label="Hasta" type="date" value={to} onChange={(e) => setTo(e.target.value)} className={cx(inputAutoCls, 'py-1.5')} />
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-xs text-white/55">
          <Toggle label="Incluir órdenes de test" checked={includeTest} onChange={setIncludeTest} />
          Incluir tests
        </label>
        {eventId && (
          <Pill tone="info">
            Filtrando por un evento
            <button type="button" aria-label="Quitar filtro de evento" onClick={() => setEventId('')} className="ml-1 hover:text-white">
              <X size={11} />
            </button>
          </Pill>
        )}
        <div className="ml-auto flex items-center gap-2">
          {hasFilters && (
            <Btn size="sm" variant="ghost" onClick={clear}>
              Limpiar filtros
            </Btn>
          )}
          <Btn size="sm" onClick={exportCsv} disabled={exporting || !orders.length}>
            <Download size={13} />
            {exporting ? 'Exportando…' : 'Exportar CSV'}
          </Btn>
        </div>
      </div>

      {error && <ErrorNote message={error} onRetry={reload} />}

      <Card flush>
        {!data && loading ? (
          <div className="space-y-2 p-5">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-10" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <EmptyState title="Sin resultados" hint={hasFilters ? 'Probá quitando algún filtro.' : 'Todavía no hay órdenes.'} />
        ) : (
          <div className={cx('transition-opacity', loading && 'opacity-60')}>
            <Table min={860}>
              <thead className="border-b border-white/[0.06]">
                <tr>
                  <Th>#</Th>
                  <Th>Evento</Th>
                  <Th>Cliente</Th>
                  <Th>Estado</Th>
                  <Th>Pago</Th>
                  <Th align="right">Total</Th>
                  <Th>Creada</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {orders.map((o) => (
                  <tr
                    key={o.id}
                    tabIndex={0}
                    onClick={() => onOpenOrder(o.id)}
                    onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onOpenOrder(o.id))}
                    className="cursor-pointer transition-colors hover:bg-white/[0.03] focus-visible:bg-white/[0.04] focus-visible:outline-none"
                  >
                    <Td>
                      <span className="font-medium text-white">{o.order_number ?? '—'}</span>
                      {o.is_test && (
                        <span className="ml-2">
                          <Pill tone="warning">Test</Pill>
                        </span>
                      )}
                    </Td>
                    <Td className="max-w-[200px] truncate">{o.event_name ?? '—'}</Td>
                    <Td className="max-w-[220px]">
                      <p className="truncate">{o.customer_name ?? '—'}</p>
                      <p className="truncate text-xs text-white/40">{o.customer_email ?? ''}</p>
                    </Td>
                    <Td>
                      <OrderStatusPill status={o.status_raw} />
                    </Td>
                    <Td>
                      <PaymentStatusPill status={o.payment_status} />
                    </Td>
                    <Td align="right">{formatPrice(o.total_amount, o.currency)}</Td>
                    <Td muted className="whitespace-nowrap">
                      {fmtDateTime(o.created_at)}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
            {data?.pagination && <Pager page={page} total={data.pagination.total} pageSize={PAGE_SIZE} onPage={setPage} />}
          </div>
        )}
      </Card>
    </div>
  )
}
