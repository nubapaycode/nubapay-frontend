'use client'

import { Search } from 'lucide-react'
import { useCallback, useState } from 'react'

import { fmtDay, fmtInt } from './format'
import { EVENT_STATUS_LABEL } from './theme'
import { Card, EmptyState, ErrorNote, Pager, Pill, Select, Skeleton, Table, Td, Th, cx, inputCls, useAsync, useDebounced, usePageForKey } from './ui'
import { fetchPlatformEventsFiltered } from '@/lib/platformAdmin'
import { formatPrice } from '@/lib/utils'

const PAGE_SIZE = 25

const STATUS_OPTIONS = [
  { value: '', label: 'Todos los estados' },
  ...Object.entries(EVENT_STATUS_LABEL).map(([value, label]) => ({ value, label })),
]
const ACTIVE_OPTIONS = [
  { value: '', label: 'Ventas: todas' },
  { value: '1', label: 'Ventas abiertas' },
  { value: '0', label: 'Ventas pausadas' },
]

export function EventsTab({ onOpenEvent, refreshKey }: { onOpenEvent: (eventId: string) => void; refreshKey: number }) {
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')
  const [active, setActive] = useState<'' | '0' | '1'>('')
  const dq = useDebounced(q, 300)
  const [page, setPage] = usePageForKey(`${dq}|${status}|${active}`)

  const load = useCallback(
    () => fetchPlatformEventsFiltered(page, PAGE_SIZE, { q: dq.trim() || undefined, status: status || undefined, active }),
    [page, dq, status, active],
  )
  const { data, error, loading, reload } = useAsync(load, [load, refreshKey])
  const events = data?.events ?? []

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[240px] flex-1">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/35" />
          <input aria-label="Buscar eventos" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nombre o slug del evento…" className={cx(inputCls, 'pl-9')} />
        </div>
        <Select label="Estado" value={status} onChange={setStatus} options={STATUS_OPTIONS} className="w-auto" />
        <Select label="Ventas" value={active} onChange={(v) => setActive(v as '' | '0' | '1')} options={ACTIVE_OPTIONS} className="w-auto" />
      </div>

      {error && <ErrorNote message={error} onRetry={reload} />}

      <Card flush>
        {!data && loading ? (
          <div className="space-y-2 p-5">
            {[0, 1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-11" />
            ))}
          </div>
        ) : events.length === 0 ? (
          <EmptyState title="Sin eventos" hint="Probá con otra búsqueda." />
        ) : (
          <div className={cx('transition-opacity', loading && 'opacity-60')}>
            <Table min={940}>
              <thead className="border-b border-white/[0.06]">
                <tr>
                  <Th>Evento</Th>
                  <Th>Estado</Th>
                  <Th>Ventas</Th>
                  <Th>Fecha</Th>
                  <Th>Organizador</Th>
                  <Th align="right">Órdenes</Th>
                  <Th align="right">Facturado</Th>
                  <Th align="right">Comisión</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {events.map((e) => (
                  <tr
                    key={e.id}
                    tabIndex={0}
                    onClick={() => onOpenEvent(e.id)}
                    onKeyDown={(ev) => (ev.key === 'Enter' || ev.key === ' ') && (ev.preventDefault(), onOpenEvent(e.id))}
                    className="cursor-pointer transition-colors hover:bg-white/[0.03] focus-visible:bg-white/[0.04] focus-visible:outline-none"
                  >
                    <Td className="max-w-[240px]">
                      <p className="truncate font-medium text-white">{e.name}</p>
                      <p className="truncate text-xs text-white/40">
                        {e.tenant_subdomain ?? 'sin tenant'} · /{e.slug}
                      </p>
                    </Td>
                    <Td>
                      <Pill tone={e.status === 'active' ? 'good' : 'neutral'}>{EVENT_STATUS_LABEL[e.status] ?? e.status}</Pill>
                    </Td>
                    <Td>
                      <Pill tone={e.is_active ? 'good' : 'critical'}>{e.is_active ? 'Abiertas' : 'Pausadas'}</Pill>
                    </Td>
                    <Td muted className="whitespace-nowrap">
                      {e.starts_at ? fmtDay(e.starts_at.slice(0, 10)) : '—'}
                    </Td>
                    <Td muted className="max-w-[200px] truncate">
                      {e.organizer?.email ?? '—'}
                    </Td>
                    <Td align="right">{fmtInt(e.stats.order_count)}</Td>
                    <Td align="right">{formatPrice(e.stats.total_revenue)}</Td>
                    <Td align="right">{formatPrice(e.stats.commission_amount)}</Td>
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
