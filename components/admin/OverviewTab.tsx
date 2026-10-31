'use client'

import { RefreshCw, Table2, LineChart } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'

import { AreaChart, BarList, Funnel, SeriesTable } from './charts'
import { fmtDay, fmtInt, fmtMoneyCompact, isoDate, plural } from './format'
import { providerColor, providerLabel, SERIES } from './theme'
import { Btn, Card, CountUp, Delta, EmptyState, ErrorNote, Segmented, Skeleton, Toggle, cx, inputAutoCls, useAsync } from './ui'
import {
  fetchPlatformStats,
  fetchPlatformUpcomingEvents,
  type DateRangeParams,
  type PlatformAdminOverview,
  type PlatformStats,
} from '@/lib/platformAdmin'
import { formatPrice } from '@/lib/utils'

type Preset = '7' | '30' | '90' | '365' | 'custom'
type Metric = 'revenue' | 'paid_orders' | 'commission' | 'service_fee'

const PRESETS: { value: Preset; label: string }[] = [
  { value: '7', label: '7 días' },
  { value: '30', label: '30 días' },
  { value: '90', label: '90 días' },
  { value: '365', label: '1 año' },
  { value: 'custom', label: 'Rango' },
]

const METRICS: Record<Metric, { label: string; money: boolean }> = {
  revenue: { label: 'Facturación', money: true },
  paid_orders: { label: 'Órdenes pagas', money: false },
  commission: { label: 'Comisión', money: true },
  service_fee: { label: 'Costo de servicio', money: true },
}

export function useDateRange(initial: Preset = '90') {
  const [preset, setPreset] = useState<Preset>(initial)
  const [from, setFrom] = useState(() => isoDate(new Date(Date.now() - 29 * 86400000)))
  const [to, setTo] = useState(() => isoDate(new Date()))
  const params: DateRangeParams = useMemo(
    () => (preset === 'custom' ? { from, to } : { days: Number(preset) }),
    [preset, from, to],
  )
  return { preset, setPreset, from, setFrom, to, setTo, params }
}

export function RangeControls({
  range,
  right,
}: {
  range: ReturnType<typeof useDateRange>
  right?: React.ReactNode
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Segmented label="Período" value={range.preset} onChange={range.setPreset} options={PRESETS} />
      {range.preset === 'custom' && (
        <div className="flex flex-wrap items-center gap-2">
          <input aria-label="Desde" type="date" value={range.from} max={range.to} onChange={(e) => range.setFrom(e.target.value)} className={cx(inputAutoCls, 'py-1.5')} />
          <span className="text-xs text-white/50">a</span>
          <input aria-label="Hasta" type="date" value={range.to} min={range.from} onChange={(e) => range.setTo(e.target.value)} className={cx(inputAutoCls, 'py-1.5')} />
        </div>
      )}
      <div className="ml-auto flex items-center gap-3">{right}</div>
    </div>
  )
}

/** Celda de la tira de métricas. Con `onSelect` funciona como selector del gráfico de abajo. */
function MetricCell({
  label,
  value,
  format,
  delta,
  deltaSuffix,
  selected,
  onSelect,
}: {
  label: string
  value: number
  format: (n: number) => string
  delta: number | null
  deltaSuffix?: string
  selected?: boolean
  onSelect?: () => void
}) {
  const body = (
    <>
      <span
        aria-hidden
        className={cx(
          'absolute inset-x-0 top-0 h-0.5 origin-left bg-admin-primary transition-transform duration-200',
          selected ? 'scale-x-100' : 'scale-x-0',
        )}
      />
      <span className={cx('block text-xs transition-colors duration-150', selected ? 'text-white/85' : 'text-white/55')}>{label}</span>
      <span className="mt-1.5 block text-[17px] font-medium tracking-tight text-white tabular-nums min-[360px]:text-lg sm:text-[22px]">
        <CountUp value={value} format={format} />
      </span>
      <span className="mt-1 block">
        <Delta value={delta} suffix={deltaSuffix} />
      </span>
    </>
  )
  const cell = 'relative min-w-0 border-b border-r border-white/[0.07] px-3 py-3.5 text-left sm:px-4'
  return onSelect ? (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cx(
        cell,
        'transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-admin-accent',
        selected ? 'bg-white/[0.03]' : 'hover:bg-white/[0.02]',
      )}
    >
      {body}
    </button>
  ) : (
    <div className={cell}>{body}</div>
  )
}

function UpcomingEvents() {
  const load = useCallback(() => fetchPlatformUpcomingEvents(1, 5), [])
  const { data, loading, error, reload } = useAsync(load, [load])
  const events = data?.events ?? []
  return (
    <Card title="Próximos eventos" subtitle="Con fecha de inicio futura" flush>
      {error ? (
        <div className="px-5 pb-5">
          <ErrorNote message={error} onRetry={reload} />
        </div>
      ) : loading && !data ? (
        <div className="space-y-2 px-5 pb-5">
          <Skeleton className="h-10" />
          <Skeleton className="h-10" />
        </div>
      ) : events.length === 0 ? (
        <EmptyState title="No hay eventos próximos" />
      ) : (
        <ul className="divide-y divide-white/[0.05]">
          {events.map((e) => (
            <li key={e.id} className="flex items-center justify-between gap-3 px-5 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-white/90">{e.name}</p>
                <p className="truncate text-xs text-white/55">{e.organizer?.email ?? 'sin organizador'}</p>
              </div>
              <div className="flex-shrink-0 text-right">
                <p className="font-admin-mono text-[13px] tabular-nums text-white/80">{e.starts_at ? fmtDay(e.starts_at.slice(0, 10)) : '—'}</p>
                <p className="text-xs tabular-nums text-white/55">{plural(e.stats.order_count, 'orden', 'órdenes')}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

function MetricsSkeleton() {
  return (
    <section className="admin-panel overflow-hidden" aria-label="Cargando métricas">
      <div className="-mb-px -mr-px grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="border-b border-r border-white/[0.07] px-4 py-3.5">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="mt-3 h-6 w-28" />
            <Skeleton className="mt-3 h-3 w-16" />
          </div>
        ))}
      </div>
      <div className="p-5">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="mt-6 h-64" />
      </div>
    </section>
  )
}

function PlatformTotals({
  summary,
  error,
  onRetry,
}: {
  summary: PlatformAdminOverview['summary'] | null
  error: string
  onRetry: () => void
}) {
  return (
    <Card title="Plataforma" subtitle="Totales históricos (sin tests)">
      {error && !summary ? (
        <ErrorNote message={error} onRetry={onRetry} />
      ) : !summary ? (
        <div className="space-y-3">
          <Skeleton className="h-9 w-40" />
          <Skeleton className="h-24" />
        </div>
      ) : (
        <>
          <p className="text-xs text-white/55">A cobrar en total</p>
          <p className="mt-1 text-[28px] font-medium tracking-tight tabular-nums text-admin-accent">
            {formatPrice(summary.total_commission + summary.total_service_fee)}
          </p>
          <dl className="mt-4 grid grid-cols-2 gap-4 border-t border-white/[0.06] pt-4">
            {[
              ['Usuarios', fmtInt(summary.total_users)],
              ['Eventos', fmtInt(summary.total_events)],
              ['Órdenes', fmtInt(summary.total_orders)],
              ['Facturado', fmtMoneyCompact(summary.total_revenue)],
            ].map(([label, v]) => (
              <div key={label}>
                <dd className="text-xl font-medium tracking-tight tabular-nums text-white">{v}</dd>
                <dt className="text-xs text-white/55">{label}</dt>
              </div>
            ))}
          </dl>
        </>
      )}
    </Card>
  )
}

export function OverviewTab({
  summary,
  summaryError,
  onRetrySummary,
}: {
  summary: PlatformAdminOverview['summary'] | null
  summaryError: string
  onRetrySummary: () => void
}) {
  const range = useDateRange('90')
  const [includeTest, setIncludeTest] = useState(false)
  const [metric, setMetric] = useState<Metric>('revenue')
  const [asTable, setAsTable] = useState(false)

  const load = useCallback(() => fetchPlatformStats(range.params, includeTest), [range.params, includeTest])
  const { data, loading, error, reload } = useAsync<PlatformStats>(load, [load])

  const points = useMemo(
    () => (data?.series ?? []).map((p) => ({ date: p.date, value: p[metric] })),
    [data, metric],
  )
  const money = METRICS[metric].money
  const fmt = money ? (n: number) => formatPrice(n) : (n: number) => fmtInt(n)
  const axis = money ? fmtMoneyCompact : (n: number) => fmtInt(n)

  const t = data?.totals
  const d = data?.deltas

  return (
    <div className="space-y-6">
      <RangeControls
        range={range}
        right={
          <>
            <label className="flex cursor-pointer items-center gap-2 text-xs text-white/55">
              <Toggle label="Incluir órdenes de test" checked={includeTest} onChange={setIncludeTest} />
              Incluir tests
            </label>
            <Btn size="sm" onClick={reload} aria-label="Actualizar" disabled={loading}>
              <RefreshCw size={13} className={cx(loading && 'animate-spin')} />
              Actualizar
            </Btn>
          </>
        }
      />

      {error && <ErrorNote message={error} onRetry={reload} />}

      {data && (
        <p className="text-xs text-white/50">
          Variaciones contra los {data.range.days} días anteriores ({fmtDay(data.range.from)} – {fmtDay(data.range.to)} vs período equivalente previo).
          Conversión en puntos porcentuales.
        </p>
      )}

      {!data && loading ? (
        <MetricsSkeleton />
      ) : data && t && d ? (
        <div className={cx('space-y-6 transition-opacity', loading && 'opacity-60')}>
          <section className="admin-panel overflow-hidden" aria-label="Métricas del período">
            <div className="-mb-px -mr-px grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
              {(Object.keys(METRICS) as Metric[]).map((k) => (
                <MetricCell
                  key={k}
                  label={METRICS[k].label}
                  value={k === 'paid_orders' ? t.paid_orders : t[k]}
                  format={METRICS[k].money ? (n) => formatPrice(n) : fmtInt}
                  delta={d[k]}
                  selected={metric === k}
                  onSelect={() => setMetric(k)}
                />
              ))}
              <MetricCell label="Ticket promedio" value={t.avg_ticket} format={(n) => formatPrice(n)} delta={d.avg_ticket} />
              <MetricCell
                label="Conversión"
                value={t.conversion}
                format={(n) => `${n.toLocaleString('es-AR')}%`}
                delta={d.conversion}
                deltaSuffix=" pp"
              />
            </div>
            <div className="px-5 pb-4 pt-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-[13px] font-medium text-white">{METRICS[metric].label} por día</h2>
                  <p className="mt-0.5 text-xs text-white/55">
                    {fmtDay(data.range.from)} – {fmtDay(data.range.to)} · hora Argentina
                  </p>
                </div>
                <Btn size="sm" onClick={() => setAsTable((v) => !v)} aria-pressed={asTable}>
                  {asTable ? <LineChart size={13} /> : <Table2 size={13} />}
                  {asTable ? 'Gráfico' : 'Tabla'}
                </Btn>
              </div>
              {!points.some((p) => p.value > 0) ? (
                <div className="flex h-[280px] items-center justify-center rounded-md border border-dashed border-white/[0.08]">
                  <EmptyState title="Sin movimiento en este período" hint="Probá con un rango más amplio." />
                </div>
              ) : asTable ? (
                <SeriesTable points={points} format={fmt} label={METRICS[metric].label} />
              ) : (
                <AreaChart
                  points={points}
                  seriesName={METRICS[metric].label}
                  format={fmt}
                  axisFormat={axis}
                  loading={loading}
                  height={280}
                  drawKey={`${metric}|${data.range.from}|${data.range.to}`}
                />
              )}
            </div>
          </section>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Card title="Embudo de órdenes" subtitle="Creadas → pagas → retiradas">
              <Funnel
                steps={[
                  { key: 'created', label: 'Creadas', value: data.funnel.created },
                  { key: 'paid', label: 'Pagas', value: data.funnel.paid },
                  { key: 'redeemed', label: 'Retiradas', value: data.funnel.redeemed },
                ]}
              />
              <dl className="mt-4 grid grid-cols-3 gap-2 border-t border-white/[0.06] pt-3 text-center">
                {[
                  ['Sin pagar', data.funnel.abandoned],
                  ['Canceladas', data.funnel.cancelled],
                  ['Fallidas', data.funnel.failed],
                ].map(([label, v]) => (
                  <div key={label as string}>
                    <dd className="text-lg font-medium tracking-tight tabular-nums text-white">{fmtInt(v as number)}</dd>
                    <dt className="text-[11px] text-white/55">{label}</dt>
                  </div>
                ))}
              </dl>
            </Card>

            <Card title="Medios de pago" subtitle="Facturación aprobada por proveedor">
              <BarList
                format={(n) => formatPrice(n)}
                rows={data.payment_methods.map((m) => ({
                  key: m.provider,
                  label: providerLabel(m.provider),
                  value: m.revenue,
                  color: providerColor(m.provider),
                  sub: plural(m.orders, 'orden', 'órdenes'),
                }))}
              />
            </Card>

            <Card title="Top eventos" subtitle="Por facturación en el período">
              <BarList
                color={SERIES.blue}
                format={(n) => formatPrice(n)}
                rows={data.top_events.map((e) => ({
                  key: e.event_id,
                  label: e.name,
                  value: e.revenue,
                  sub: `${e.tenant_subdomain ? e.tenant_subdomain + ' · ' : ''}${plural(e.paid_orders, 'orden paga', 'órdenes pagas')}`,
                }))}
              />
            </Card>
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <UpcomingEvents />
        </div>
        <PlatformTotals summary={summary} error={summaryError} onRetry={onRetrySummary} />
      </div>
    </div>
  )
}
