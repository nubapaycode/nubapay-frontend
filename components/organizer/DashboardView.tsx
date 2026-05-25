'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import { OrganizerToolHeading } from '@/components/organizer/OrganizerToolHeading'
import { Spinner } from '@/components/ui/Spinner'
import type { DashboardSummary } from '@/lib/organizerWorkspace'
import { fetchEventDashboard } from '@/lib/organizerWorkspace'
import { formatPrice } from '@/lib/utils'
import type { OrderStatus } from '@/types'

const PAYMENT_CONFIG = [
  { key: 'mp', label: 'Mercado Pago', dot: 'bg-blue-400' },
  { key: 'cash', label: 'Efectivo', dot: 'bg-green-400' },
  { key: 'transfer', label: 'Transferencia', dot: 'bg-purple-400' },
] as const

const STATUS_CONFIG: { key: OrderStatus; label: string; dot: string }[] = [
  { key: 'pending', label: 'Pendientes de pago', dot: 'bg-amber-400' },
  { key: 'paid', label: 'Pagados', dot: 'bg-blue-400' },
  { key: 'delivered', label: 'Finalizados', dot: 'bg-gray-300' },
  { key: 'cancelled', label: 'Cancelados', dot: 'bg-red-300' },
]

// Anima un número de 0 al valor objetivo con easing cubic-out
function CountUp({ to, format = String, duration = 700 }: { to: number; format?: (n: number) => string; duration?: number }) {
  const [val, setVal] = useState(0)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    setVal(0)
    if (to === 0) return
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1)
      const eased = 1 - (1 - t) ** 3
      const next = Math.round(eased * to)
      setVal(next)
      if (t < 1) rafRef.current = requestAnimationFrame(tick)
      else setVal(to)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [to, duration])

  return <>{format(val)}</>
}

function LineChart({ data }: { data: { hour: string; revenue: number }[] }) {
  const W = 400
  const H = 150
  const pad = { left: 4, right: 4, top: 8, bottom: 4 }
  const maxVal = Math.max(...data.map(d => d.revenue), 1)

  const pts = data.map((d, i) => {
    const x = pad.left + (i / Math.max(data.length - 1, 1)) * (W - pad.left - pad.right)
    const y = pad.top + (1 - d.revenue / maxVal) * (H - pad.top - pad.bottom)
    return { x, y, ...d }
  })

  const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  const areaPath = `${linePath} L ${pts[pts.length - 1].x} ${H} L ${pts[0].x} ${H} Z`

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 150 }}>
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#111827" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#111827" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#areaGrad)" />
      <path d={linePath} fill="none" stroke="#111827" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="2.5" fill="#111827" />
      ))}
    </svg>
  )
}

export function DashboardView({ eventId }: { eventId: string }) {
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [loadError, setLoadError] = useState('')
  const [loading, setLoading] = useState(true)
  const [barsVisible, setBarsVisible] = useState(false)

  const load = useCallback(async () => {
    setLoadError('')
    const res = await fetchEventDashboard(eventId)
    if (!res.ok) {
      setLoadError(res.error)
      setSummary(null)
    } else {
      setSummary(res.data)
    }
    setLoading(false)
  }, [eventId])

  useEffect(() => {
    setLoading(true)
    load()
  }, [load])

  // Doble RAF para asegurar que las barras renderizan en 0 antes de transicionar
  useEffect(() => {
    if (!summary) { setBarsVisible(false); return }
    setBarsVisible(false)
    const id1 = requestAnimationFrame(() => {
      const id2 = requestAnimationFrame(() => setBarsVisible(true))
      return () => cancelAnimationFrame(id2)
    })
    return () => cancelAnimationFrame(id1)
  }, [summary])

  const ordersLen = summary?.order_count ?? 0
  const byStatus = (k: OrderStatus) => summary?.by_status?.[k] ?? 0

  const paymentRow = (key: 'mp' | 'cash' | 'transfer') =>
    summary?.payment_breakdown?.find(p => p.key === key) ?? { key, count: 0, revenue: 0 }

  const topProducts = summary?.top_products ?? []
  const maxQty = topProducts[0]?.quantity ?? 1
  const hourlyData = summary?.hourly ?? []

  const barStyle = (pct: number) => ({
    width: barsVisible ? `${pct}%` : '0%',
    transition: 'width 700ms cubic-bezier(0.4,0,0.2,1)',
  })

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <Spinner size="lg" className="text-gray-900" />
        <p className="text-sm text-gray-400">Cargando métricas…</p>
      </div>
    )
  }

  if (loadError || !summary) {
    return (
      <div className="space-y-4">
        <OrganizerToolHeading title="Dashboard del evento" />
        <div className="bg-white rounded-2xl border border-gray-100 p-6 text-sm text-red-600">{loadError || 'Sin datos'}</div>
        <button
          type="button"
          onClick={() => { setLoading(true); load() }}
          className="rounded-full border border-gray-900 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50"
        >
          Reintentar
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <style>{`
        @keyframes nb-stat-in {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .nb-stat-card {
          animation: nb-stat-in 320ms ease-out both;
        }
      `}</style>

      <OrganizerToolHeading
        title="Dashboard del evento"
        description="Métricas y pedidos solo para este evento."
      />

      {/* Stat cards con fade+slide escalonado */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Recaudado', value: <CountUp to={summary.total_revenue} format={formatPrice} duration={800} /> },
          { label: 'Pedidos',   value: <CountUp to={summary.order_count} duration={600} /> },
          { label: 'Activos',   value: <CountUp to={summary.active_orders} duration={500} /> },
          { label: 'Entregados',value: <CountUp to={summary.delivered_orders} duration={500} /> },
        ].map(({ label, value }, i) => (
          <div
            key={label}
            className="nb-stat-card bg-white rounded-2xl border border-gray-100 p-4"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <p className="text-xs text-gray-400 mb-1">{label}</p>
            <p className="text-lg font-medium text-gray-900">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

        <div className="lg:col-span-2 flex flex-col gap-4">

          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <p className="text-xs font-medium text-gray-400 tracking-wide mb-4">Por estado</p>
            <div className="flex flex-col gap-3">
              {STATUS_CONFIG.map(({ key, label, dot }) => {
                const count = byStatus(key)
                const pct = ordersLen ? Math.round((count / ordersLen) * 100) : 0
                return (
                  <div key={key}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${dot}`} />
                        <span className="text-sm text-gray-600">{label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">{count}</span>
                        <span className="text-xs text-gray-300 w-7 text-right">{pct}%</span>
                      </div>
                    </div>
                    <div className="h-1 bg-gray-100 rounded-full overflow-hidden ml-4">
                      <div className={`h-full rounded-full ${dot}`} style={barStyle(pct)} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-medium text-gray-400 tracking-wide">Ventas por hora</p>
              <span className="text-xs text-gray-400">últimas 8h</span>
            </div>
            <LineChart data={hourlyData.length ? hourlyData : Array.from({ length: 8 }, (_, i) => ({ hour: `${i}h`, revenue: 0 }))} />
            <div className="flex justify-between mt-2">
              {(hourlyData.length ? hourlyData : []).map(d => (
                <span key={d.hour} className="text-[10px] text-gray-300">{d.hour}</span>
              ))}
            </div>
          </div>

        </div>

        <div className="lg:col-span-3 flex flex-col gap-4">

          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <p className="text-xs font-medium text-gray-400 tracking-wide mb-4">Métodos de pago</p>
            <div className="flex flex-col gap-3">
              {PAYMENT_CONFIG.map(({ key, label, dot }) => {
                const row = paymentRow(key)
                const count = row.count
                const pct = ordersLen ? Math.round((count / ordersLen) * 100) : 0
                const revenue = row.revenue
                return (
                  <div key={key}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${dot}`} />
                        <span className="text-sm text-gray-600">{label}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-400">{count} pedidos</span>
                        <span className="text-sm font-medium text-gray-900 w-20 text-right">{formatPrice(revenue)}</span>
                      </div>
                    </div>
                    <div className="h-1 bg-gray-100 rounded-full overflow-hidden ml-4">
                      <div className={`h-full rounded-full ${dot}`} style={barStyle(pct)} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <p className="text-xs font-medium text-gray-400 tracking-wide mb-4">Más vendidos</p>
            {topProducts.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-center">
                <div className="w-10 h-10 rounded-2xl bg-gray-50 flex items-center justify-center mb-3">
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M2 14l4-6 3 3 7-9" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
                <p className="text-sm font-medium text-gray-900">Sin ventas aún</p>
                <p className="text-xs text-gray-400 mt-1">Los más vendidos aparecerán acá</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {topProducts.map((product, i) => (
                  <div key={product.name}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2.5">
                        <span className="text-xs text-gray-300 font-medium w-3 shrink-0">{i + 1}</span>
                        <span className="text-sm font-medium text-gray-800 truncate max-w-[160px]">{product.name}</span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs text-gray-400">{product.quantity} uds.</span>
                        <span className="text-sm font-medium text-gray-900 w-20 text-right">{formatPrice(product.revenue)}</span>
                      </div>
                    </div>
                    <div className="h-1 bg-gray-100 rounded-full overflow-hidden ml-5">
                      <div
                        className="h-full bg-gray-900 rounded-full"
                        style={barStyle((product.quantity / maxQty) * 100)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
