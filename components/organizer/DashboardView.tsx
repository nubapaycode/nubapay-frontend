'use client'

import { BarChart3, Eye, EyeOff, RotateCw, Table2 } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

import { AnimatedCount, AnimatedMoney, DeltaBadge, Money, deltaPct, formatCount } from '@/components/organizer/dashboard/AnimatedNumber'
import {
  FilterChip,
  LivePanel,
  PAYMENT_CONFIG,
  PaymentMethodsPanel,
  StatusPanel,
  TopProductsPanel,
} from '@/components/organizer/dashboard/Panels'
import {
  PeriodPicker,
  PRESETS,
  daysAgo,
  formatDay,
  isoLocal,
  rangeForPreset,
  type Preset,
} from '@/components/organizer/dashboard/PeriodPicker'
import { SalesChart, pointValue, type ChartMetric } from '@/components/organizer/dashboard/SalesChart'
import type { DashboardPaymentKey, DashboardRange, DashboardSummary } from '@/lib/organizerWorkspace'
import { fetchEventDashboard } from '@/lib/organizerWorkspace'

const HIDE_AMOUNTS_KEY = 'nubapay_hide_amounts'

const METRIC_TABS: { key: ChartMetric; label: string }[] = [
  { key: 'revenue', label: 'Recaudado' },
  { key: 'orders', label: 'Pedidos' },
  { key: 'avg', label: 'Ticket promedio' },
]

/** Estado del panel que viaja en la URL, así un filtro se puede compartir o recargar. */
type UrlState = {
  preset: Preset
  customFrom: string
  customTo: string
  payment: DashboardPaymentKey | null
  product: string | null
}

function readUrlState(): Partial<UrlState> {
  if (typeof window === 'undefined') return {}
  const q = new URLSearchParams(window.location.search)
  const out: Partial<UrlState> = {}
  const periodo = q.get('periodo')
  if (periodo && ['all', 'today', '7', '30', 'custom'].includes(periodo)) out.preset = periodo as Preset
  const desde = q.get('desde')
  const hasta = q.get('hasta')
  if (desde && hasta && /^\d{4}-\d{2}-\d{2}$/.test(desde) && /^\d{4}-\d{2}-\d{2}$/.test(hasta)) {
    out.customFrom = desde
    out.customTo = hasta
  }
  const pago = q.get('pago')
  if (pago && PAYMENT_CONFIG.some(p => p.key === pago)) out.payment = pago as DashboardPaymentKey
  const producto = q.get('producto')
  if (producto) out.product = producto
  return out
}

function writeUrlState(s: UrlState) {
  if (typeof window === 'undefined') return
  const q = new URLSearchParams(window.location.search)
  for (const k of ['periodo', 'desde', 'hasta', 'pago', 'producto']) q.delete(k)
  if (s.preset !== 'all') q.set('periodo', s.preset)
  if (s.preset === 'custom') {
    q.set('desde', s.customFrom)
    q.set('hasta', s.customTo)
  }
  if (s.payment) q.set('pago', s.payment)
  if (s.product) q.set('producto', s.product)
  const qs = q.toString()
  window.history.replaceState(window.history.state, '', `${window.location.pathname}${qs ? `?${qs}` : ''}`)
}

function periodPhrase(preset: Preset, range: DashboardRange | null) {
  if (!range) return 'en todo el evento'
  if (preset === 'today') return 'hoy'
  if (preset === '7') return 'en los últimos 7 días'
  if (preset === '30') return 'en los últimos 30 días'
  return range.from === range.to ? `el ${formatDay(range.from)}` : `del ${formatDay(range.from)} al ${formatDay(range.to)}`
}

/** Frase de encabezado con el dato que importa, en lugar de un título genérico. */
function Headline({ summary, preset, range, hidden }: { summary: DashboardSummary; preset: Preset; range: DashboardRange | null; hidden: boolean }) {
  if (summary.order_count === 0) {
    return <>Todavía no hay ventas {periodPhrase(preset, range)}.</>
  }
  const pct = deltaPct(summary.total_revenue, summary.comparison?.total_revenue)
  return (
    <>
      Recaudaste <Money value={summary.total_revenue} hidden={hidden} className="tabular-nums" /> {periodPhrase(preset, range)}
      {pct != null && Math.round(pct) !== 0 ? (
        <span className="text-gray-400">
          , {Math.abs(Math.round(pct))}% {pct > 0 ? 'más' : 'menos'} que el período anterior.
        </span>
      ) : (
        '.'
      )}
    </>
  )
}

function DashboardSkeleton() {
  return (
    <div className="mx-auto max-w-[1180px] space-y-5" aria-busy="true">
      <p className="sr-only">Cargando métricas…</p>
      <div className="h-4 w-24 animate-pulse rounded bg-gray-100" />
      <div className="h-8 w-[min(520px,90%)] animate-pulse rounded-lg bg-gray-100" />
      <div className="h-9 w-48 animate-pulse rounded-xl bg-gray-100" />
      <div className="h-[360px] animate-pulse rounded-2xl bg-gray-100" />
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="h-56 animate-pulse rounded-2xl bg-gray-100 lg:col-span-2" />
        <div className="h-56 animate-pulse rounded-2xl bg-gray-100" />
      </div>
    </div>
  )
}

export function DashboardView({ eventId }: { eventId: string }) {
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [loadError, setLoadError] = useState('')
  const [loading, setLoading] = useState(true)
  const [fetching, setFetching] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const [hydrated, setHydrated] = useState(false)
  const [preset, setPreset] = useState<Preset>('all')
  const [customFrom, setCustomFrom] = useState(() => daysAgo(6))
  const [customTo, setCustomTo] = useState(() => isoLocal(new Date()))
  // El rango se calcula al elegir el período (no en el render), así `new Date()` queda en los handlers.
  const [range, setRange] = useState<DashboardRange | null>(null)
  const [payment, setPayment] = useState<DashboardPaymentKey | null>(null)
  const [product, setProduct] = useState<string | null>(null)

  const [metric, setMetric] = useState<ChartMetric>('revenue')
  const [chartView, setChartView] = useState<'chart' | 'table'>('chart')
  const [scrub, setScrub] = useState<number | null>(null)
  const [hidden, setHidden] = useState(false)

  // La URL y la preferencia de montos ocultos se leen al montar (no existen en el render del servidor).
  useEffect(() => {
    const s = readUrlState()
    const from = s.customFrom ?? customFrom
    const to = s.customTo ?? customTo
    const p = s.preset ?? 'all'
    queueMicrotask(() => {
      setPreset(p)
      setCustomFrom(from)
      setCustomTo(to)
      setRange(rangeForPreset(p, from, to))
      setPayment(s.payment ?? null)
      setProduct(s.product ?? null)
      try {
        setHidden(window.localStorage.getItem(HIDE_AMOUNTS_KEY) === '1')
      } catch {
        /* almacenamiento bloqueado: se muestran los montos */
      }
      setHydrated(true)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo al montar
  }, [])

  useEffect(() => {
    if (!hydrated) return
    writeUrlState({ preset, customFrom, customTo, payment, product })
  }, [hydrated, preset, customFrom, customTo, payment, product])

  const choosePreset = useCallback(
    (p: Exclude<Preset, 'custom'>) => {
      setPreset(p)
      setRange(rangeForPreset(p, customFrom, customTo))
    },
    [customFrom, customTo],
  )

  const chooseCustom = (from: string, to: string) => {
    setPreset('custom')
    setCustomFrom(from)
    setCustomTo(to)
    setRange(rangeForPreset('custom', from, to))
  }

  const toggleHidden = () => {
    setHidden(h => {
      try {
        window.localStorage.setItem(HIDE_AMOUNTS_KEY, h ? '0' : '1')
      } catch {
        /* sin almacenamiento: vale solo para esta visita */
      }
      return !h
    })
  }

  const rangeFrom = range ? range.from : ''
  const rangeTo = range ? range.to : ''

  const load = useCallback(
    async (silent = false) => {
      if (!silent) {
        setLoadError('')
        setFetching(true)
      }
      const res = await fetchEventDashboard(eventId, rangeFrom && rangeTo ? { from: rangeFrom, to: rangeTo } : null, {
        payment,
        product,
      })
      if (!res.ok) {
        if (!silent) {
          setLoadError(res.error)
          setSummary(null)
        }
      } else {
        setSummary(res.data)
        setLastUpdated(new Date())
      }
      setFetching(false)
      setLoading(false)
    },
    [eventId, rangeFrom, rangeTo, payment, product],
  )

  useEffect(() => {
    if (!hydrated) return
    const id = window.requestAnimationFrame(() => void load())
    return () => window.cancelAnimationFrame(id)
  }, [hydrated, load])

  useEffect(() => {
    if (!hydrated) return
    const id = setInterval(() => void load(true), 30_000)
    return () => clearInterval(id)
  }, [hydrated, load])

  if (loading) return <DashboardSkeleton />

  if (loadError || !summary) {
    return (
      <div className="mx-auto max-w-[1180px] space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Dashboard del evento</h1>
        <div className="rounded-2xl border border-red-100 bg-red-50/60 p-5 text-sm text-red-700">{loadError || 'Sin datos'}</div>
        <button
          type="button"
          onClick={() => {
            setLoading(true)
            void load()
          }}
          className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-900 transition-colors hover:bg-gray-50"
        >
          Reintentar
        </button>
      </div>
    )
  }

  const points = summary.series?.points ?? (summary.hourly ?? []).map(h => ({ label: h.hour, revenue: h.revenue }))
  const chartIsDaily = summary.series?.kind === 'daily'
  const hasComparison = Boolean(summary.comparison) && chartIsDaily
  const comparison = summary.comparison
  const avgTicket = summary.avg_ticket ?? (summary.order_count ? summary.total_revenue / summary.order_count : 0)

  const totals: Record<ChartMetric, { value: number; prev?: number }> = {
    revenue: { value: summary.total_revenue, prev: comparison?.total_revenue },
    orders: { value: summary.order_count, prev: comparison?.order_count },
    avg: { value: avgTicket, prev: comparison?.avg_ticket },
  }

  const scrubPoint = scrub != null ? points[scrub] : null
  const paymentLabel = PAYMENT_CONFIG.find(p => p.key === payment)?.label

  return (
    <div className={`mx-auto max-w-[1180px] transition-opacity duration-300 ${fetching ? 'opacity-70' : ''}`}>
      <style>{`
        @keyframes nb-rise { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
        @keyframes nb-pop { from { opacity: 0; transform: translateY(-4px) scale(0.98); } to { opacity: 1; transform: none; } }
        @keyframes nb-grow { from { transform: scaleX(0); } to { transform: scaleX(1); } }
        .nb-rise { animation: nb-rise 420ms cubic-bezier(0.22,1,0.36,1) both; }
        .nb-pop { animation: nb-pop 160ms ease-out both; transform-origin: top left; }
        .nb-grow, .nb-bar { transform-origin: left; animation: nb-grow 700ms cubic-bezier(0.22,1,0.36,1) both; transition: width 500ms cubic-bezier(0.22,1,0.36,1); }
        @media (prefers-reduced-motion: reduce) { .nb-rise, .nb-pop, .nb-grow, .nb-bar { animation: none; } }
      `}</style>

      {/* Encabezado */}
      <header className="mb-5 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          <p className="mb-1.5 text-[12px] font-medium text-gray-400">Dashboard</p>
          <h1 className="max-w-[680px] text-[22px] font-semibold leading-snug tracking-tight text-gray-900 md:text-[26px]">
            <Headline summary={summary} preset={preset} range={range} hidden={hidden} />
          </h1>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {lastUpdated && (
            <span className="mr-1 text-[12px] tabular-nums text-gray-400">
              Actualizado {lastUpdated.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })}
            </span>
          )}
          <button
            type="button"
            onClick={() => void load()}
            aria-label="Actualizar"
            title="Actualizar"
            className="rounded-xl p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-900"
          >
            <RotateCw size={16} strokeWidth={1.75} className={fetching ? 'animate-spin' : ''} aria-hidden />
          </button>
          <button
            type="button"
            onClick={toggleHidden}
            aria-pressed={hidden}
            aria-label={hidden ? 'Mostrar montos' : 'Ocultar montos'}
            title={hidden ? 'Mostrar montos' : 'Ocultar montos'}
            className="rounded-xl p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-900"
          >
            {hidden ? <EyeOff size={16} strokeWidth={1.75} aria-hidden /> : <Eye size={16} strokeWidth={1.75} aria-hidden />}
          </button>
        </div>
      </header>

      {/* Barra de filtros: queda fija arriba al hacer scroll (Dub). */}
      <div className="sticky top-0 z-20 -mx-4 mb-4 flex flex-wrap items-center gap-2 bg-white/85 px-4 py-2.5 backdrop-blur md:-mx-2 md:px-2">
        <PeriodPicker
          preset={preset}
          range={range}
          customFrom={customFrom}
          customTo={customTo}
          onPreset={choosePreset}
          onCustom={chooseCustom}
        />
        {comparison && (
          <span className="text-[12px] text-gray-400">
            vs. {formatDay(comparison.range.from)} – {formatDay(comparison.range.to)}
          </span>
        )}
        {paymentLabel && <FilterChip label="Pago" value={paymentLabel} onClear={() => setPayment(null)} />}
        {product && <FilterChip label="Producto" value={product} onClear={() => setProduct(null)} />}
        <span className="ml-auto hidden text-[11px] text-gray-400 lg:inline">
          Atajos: {PRESETS.map(p => p.key).join(' · ')}
        </span>
      </div>

      {/* Métricas como pestañas que eligen la serie del gráfico (Plausible) */}
      <section className="nb-rise mb-4 overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
        <div role="tablist" aria-label="Métrica del gráfico" className="grid grid-cols-2 border-b border-gray-100 md:grid-cols-4">
          {METRIC_TABS.map(tab => {
            const active = metric === tab.key
            const t = totals[tab.key]
            // Mientras se recorre el gráfico, la pestaña activa muestra el valor del punto (Mercury).
            const showScrub = active && scrubPoint != null
            const value = showScrub ? pointValue(scrubPoint, tab.key) : t.value
            return (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setMetric(tab.key)}
                className={`group relative px-5 py-4 text-left transition-colors md:border-r md:border-gray-100 ${
                  active ? 'bg-white' : 'bg-gray-50/60 hover:bg-gray-50'
                }`}
              >
                <span className={`mb-1.5 flex items-center gap-2 text-[12px] ${active ? 'font-medium text-gray-900' : 'text-gray-500'}`}>
                  {tab.label}
                  {!showScrub && <DeltaBadge pct={deltaPct(t.value, t.prev)} />}
                </span>
                <span className="block text-[22px] font-semibold tracking-tight tabular-nums text-gray-900">
                  {tab.key === 'orders' ? (
                    <AnimatedCount value={value} />
                  ) : showScrub ? (
                    <Money value={tab.key === 'avg' ? Math.round(value) : value} hidden={hidden} />
                  ) : (
                    <AnimatedMoney value={value} hidden={hidden} />
                  )}
                </span>
                <span className="mt-0.5 block h-4 text-[11px] tabular-nums text-gray-400">
                  {showScrub ? (
                    scrubPoint.label
                  ) : t.prev != null ? (
                    <>
                      antes{' '}
                      {tab.key === 'orders' ? formatCount(t.prev) : <Money value={tab.key === 'avg' ? Math.round(t.prev) : t.prev} hidden={hidden} />}
                    </>
                  ) : null}
                </span>
                <span
                  aria-hidden
                  className={`absolute inset-x-0 bottom-0 h-0.5 bg-gray-900 transition-transform duration-300 ${active ? 'scale-x-100' : 'scale-x-0'}`}
                />
              </button>
            )
          })}
          <div className="px-5 py-4">
            <span className="mb-1.5 block text-[12px] text-gray-500">Activos</span>
            <span className="block text-[22px] font-semibold tracking-tight tabular-nums text-gray-900">
              <AnimatedCount value={summary.active_orders} />
            </span>
            <span className="mt-0.5 block text-[11px] tabular-nums text-gray-400">
              {formatCount(summary.delivered_orders)} entregados
            </span>
          </div>
        </div>

        <div className="px-5 pb-4 pt-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-4 text-[12px]">
              <span className="font-medium text-gray-900">{chartIsDaily ? 'Ventas por día' : 'Ventas por hora'}</span>
              <span className="flex items-center gap-1.5 text-gray-500">
                <span className="h-0.5 w-3 rounded-full bg-gray-900" aria-hidden />
                {chartIsDaily ? 'Período elegido' : 'Últimas 8 h'}
              </span>
              {hasComparison && (
                <span className="flex items-center gap-1.5 text-gray-400">
                  <span className="w-3 border-t-[1.5px] border-dashed border-gray-400" aria-hidden />
                  Período anterior
                </span>
              )}
            </div>
            <div className="inline-flex rounded-lg bg-gray-100 p-0.5" role="group" aria-label="Vista del gráfico">
              {(
                [
                  { v: 'chart', label: 'Gráfico', Icon: BarChart3 },
                  { v: 'table', label: 'Tabla', Icon: Table2 },
                ] as const
              ).map(({ v, label, Icon }) => (
                <button
                  key={v}
                  type="button"
                  aria-pressed={chartView === v}
                  aria-label={label}
                  title={label}
                  onClick={() => setChartView(v)}
                  className={`rounded-md p-1.5 transition-colors ${
                    chartView === v ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-700'
                  }`}
                >
                  <Icon size={14} strokeWidth={1.75} aria-hidden />
                </button>
              ))}
            </div>
          </div>
          <SalesChart
            points={points}
            metric={metric}
            showComparison={hasComparison}
            hiddenAmounts={hidden}
            view={chartView}
            onScrub={setScrub}
          />
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <PaymentMethodsPanel summary={summary} hidden={hidden} selected={payment} onSelect={setPayment} />
        </div>
        <LivePanel summary={summary} hidden={hidden} />
        <div className="lg:col-span-2">
          <TopProductsPanel summary={summary} hidden={hidden} selected={product} onSelect={setProduct} />
        </div>
        <StatusPanel summary={summary} />
      </div>
    </div>
  )
}
