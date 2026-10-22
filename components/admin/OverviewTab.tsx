'use client'

import { RefreshCw, Table2, LineChart } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'

import { AreaChart, BarList, Funnel, SeriesTable, Sparkline } from './charts'
import { fmtDay, fmtInt, fmtMoneyCompact, isoDate, plural } from './format'
import { providerColor, providerLabel, SERIES } from './theme'
import { Btn, Card, Delta, EmptyState, ErrorNote, Segmented, Skeleton, Toggle, cx, inputAutoCls, useAsync } from './ui'
import {
  fetchPlatformStats,
  fetchPlatformUpcomingEvents,
  type DateRangeParams,
  type PlatformAdminOverview,
  type PlatformStats,
} from '@/lib/platformAdmin'
import { formatPrice } from '@/lib/utils'

type Preset = '7' | '30' | '90' | '365' | 'custom'
type Metric = 'revenue' | 'paid_orders' | 'commission'

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
          <span className="text-xs text-white/35">a</span>
          <input aria-label="Hasta" type="date" value={range.to} min={range.from} onChange={(e) => range.setTo(e.target.value)} className={cx(inputAutoCls, 'py-1.5')} />
        </div>
      )}
      <div className="ml-auto flex items-center gap-3">{right}</div>
    </div>
  )
}

function Kpi({
  label,
  value,
  delta,
  deltaSuffix,
  spark,
  hero,
  hint,
}: {
  label: string
  value: string
  delta: number | null
  deltaSuffix?: string
  spark?: number[]
  hero?: boolean
  hint?: string
}) {
  return (
    <div className={cx('rounded-2xl border border-white/[0.08] bg-[#12121A] p-5', hero && 'lg:col-span-2')}>
      <p className="text-xs font-medium text-white/45">{label}</p>
      <p className={cx('mt-2 truncate font-semibold tracking-tight text-white', hero ? 'text-5xl' : 'text-2xl')}>{value}</p>
      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="flex min-w-0 flex-col">
          <Delta value={delta} suffix={deltaSuffix} />
          {hint && <span className="text-[11px] text-white/30">{hint}</span>}
        </div>
        {spark && <Sparkline values={spark} width={hero ? 160 : 76} height={hero ? 36 : 28} />}
      </div>
    </div>
  )
}

function UpcomingEvents() {
  const load = useCallback(() => fetchPlatformUpcomingEvents(1, 6), [])
  const { data, loading, error } = useAsync(load, [load])
  const events = data?.events ?? []
  return (
    <Card title="Próximos eventos" subtitle="Con fecha de inicio futura" flush>
      {error ? (
        <div className="px-5 pb-5">
          <ErrorNote message={error} />
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
                <p className="truncate text-xs text-white/40">{e.organizer?.email ?? 'sin organizador'}</p>
              </div>
              <div className="flex-shrink-0 text-right">
                <p className="text-sm tabular-nums text-white/80">{e.starts_at ? fmtDay(e.starts_at.slice(0, 10)) : '—'}</p>
                <p className="text-xs tabular-nums text-white/40">{e.stats.order_count} órdenes</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

export function OverviewTab({ summary }: { summary: PlatformAdminOverview['summary'] }) {
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

  const spark = (key: 'revenue' | 'paid_orders' | 'commission') => (data?.series ?? []).map((p) => p[key])
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
        <p className="text-xs text-white/35">
          Variaciones contra los {data.range.days} días anteriores ({fmtDay(data.range.from)} – {fmtDay(data.range.to)} vs período equivalente previo).
          Conversión en puntos porcentuales.
        </p>
      )}

      {!data && loading ? (
        <div className="grid gap-4 lg:grid-cols-6">
          <Skeleton className="h-36 lg:col-span-2" />
          <Skeleton className="h-36" />
          <Skeleton className="h-36" />
          <Skeleton className="h-36" />
          <Skeleton className="h-36" />
        </div>
      ) : data && t && d ? (
        <div className={cx('space-y-6 transition-opacity', loading && 'opacity-60')}>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
            <Kpi hero label="Facturación" value={formatPrice(t.revenue)} delta={d.revenue} spark={spark('revenue')} />
            <Kpi label="Comisión (1%)" value={formatPrice(t.commission)} delta={d.commission} spark={spark('commission')} />
            <Kpi label="Órdenes pagas" value={fmtInt(t.paid_orders)} delta={d.paid_orders} spark={spark('paid_orders')} />
            <Kpi label="Ticket promedio" value={formatPrice(t.avg_ticket)} delta={d.avg_ticket} />
            <Kpi label="Conversión" value={`${t.conversion.toLocaleString('es-AR')}%`} delta={d.conversion} deltaSuffix=" pp" />
          </div>

          <Card
            title={METRICS[metric].label + ' por día'}
            subtitle={`${fmtDay(data.range.from)} – ${fmtDay(data.range.to)} · hora Argentina`}
            action={
              <div className="flex flex-wrap items-center gap-2">
                <Segmented
                  label="Métrica"
                  value={metric}
                  onChange={setMetric}
                  options={(Object.keys(METRICS) as Metric[]).map((k) => ({ value: k, label: METRICS[k].label }))}
                />
                <Btn size="sm" onClick={() => setAsTable((v) => !v)} aria-pressed={asTable}>
                  {asTable ? <LineChart size={13} /> : <Table2 size={13} />}
                  {asTable ? 'Gráfico' : 'Tabla'}
                </Btn>
              </div>
            }
          >
            {asTable ? (
              <SeriesTable points={points} format={fmt} label={METRICS[metric].label} />
            ) : (
              <AreaChart points={points} seriesName={METRICS[metric].label} format={fmt} axisFormat={axis} loading={loading} />
            )}
          </Card>

          <div className="grid gap-4 lg:grid-cols-3">
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
                    <dd className="text-lg font-semibold tabular-nums text-white">{fmtInt(v as number)}</dd>
                    <dt className="text-[11px] text-white/40">{label}</dt>
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

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <UpcomingEvents />
        </div>
        <Card title="Plataforma" subtitle="Totales históricos (sin tests)">
          <dl className="grid grid-cols-2 gap-4">
            {[
              ['Usuarios', fmtInt(summary.total_users)],
              ['Eventos', fmtInt(summary.total_events)],
              ['Órdenes', fmtInt(summary.total_orders)],
              ['Facturado', fmtMoneyCompact(summary.total_revenue)],
            ].map(([label, v]) => (
              <div key={label}>
                <dd className="text-xl font-semibold tabular-nums text-white">{v}</dd>
                <dt className="text-xs text-white/40">{label}</dt>
              </div>
            ))}
          </dl>
          <p className="mt-4 border-t border-white/[0.06] pt-3 text-xs text-white/40">
            A cobrar en total: <span className="font-semibold text-white/80">{formatPrice(summary.total_commission)}</span>
          </p>
        </Card>
      </div>
    </div>
  )
}
