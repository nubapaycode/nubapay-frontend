'use client'

import { useEffect, useRef, useState } from 'react'

import type { DashboardSeriesPoint } from '@/lib/organizerWorkspace'

import { Money, formatCount } from './AnimatedNumber'

export type ChartMetric = 'revenue' | 'orders' | 'avg'

export function pointValue(p: DashboardSeriesPoint, metric: ChartMetric, prev = false): number {
  const revenue = prev ? p.prev_revenue ?? 0 : p.revenue
  const orders = prev ? p.prev_orders ?? 0 : p.orders ?? 0
  if (metric === 'revenue') return revenue
  if (metric === 'orders') return orders
  return orders ? revenue / orders : 0
}

const H = 220
const PAD = { top: 12, right: 8, bottom: 26, left: 52 }

const COMPACT = new Intl.NumberFormat('es-AR', { notation: 'compact', maximumFractionDigits: 1 })

/** Tope "lindo" del eje (1, 2, 2.5, 5 × 10^n) para que las líneas de guía caigan en números redondos. */
function niceMax(v: number) {
  if (v <= 0) return 1
  const exp = 10 ** Math.floor(Math.log10(v))
  const f = v / exp
  const nice = f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10
  return nice * exp
}

function formatValue(v: number, metric: ChartMetric, hidden: boolean) {
  if (metric === 'orders') return formatCount(Math.round(v))
  return <Money value={metric === 'avg' ? Math.round(v) : v} hidden={hidden} />
}

export function SalesChart({
  points,
  metric,
  showComparison,
  hiddenAmounts,
  view,
  onScrub,
}: {
  points: DashboardSeriesPoint[]
  metric: ChartMetric
  showComparison: boolean
  hiddenAmounts: boolean
  view: 'chart' | 'table'
  onScrub?: (index: number | null) => void
}) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(640)
  const [hover, setHover] = useState<number | null>(null)

  useEffect(() => {
    const el = wrapRef.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(entries => {
      const w = entries[0]?.contentRect.width
      if (w) setWidth(w)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const safePoints = points.length ? points : Array.from({ length: 8 }, (_, i) => ({ label: `${i}h`, revenue: 0, orders: 0 }))
  const values = safePoints.map(p => pointValue(p, metric))
  const prevValues = showComparison ? safePoints.map(p => pointValue(p, metric, true)) : []
  const maxY = niceMax(Math.max(...values, ...prevValues, 0))

  const innerW = Math.max(width - PAD.left - PAD.right, 10)
  const innerH = H - PAD.top - PAD.bottom
  const x = (i: number) => PAD.left + (i / Math.max(safePoints.length - 1, 1)) * innerW
  const y = (v: number) => PAD.top + (1 - v / maxY) * innerH

  const linePath = (vals: number[]) => vals.map((v, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ')
  const mainPath = linePath(values)
  const areaPath = `${mainPath} L ${x(values.length - 1)} ${PAD.top + innerH} L ${x(0)} ${PAD.top + innerH} Z`

  // Clave que reinicia la animación de trazado cuando cambian los datos o la métrica.
  const drawKey = `${metric}-${values.join(',')}`

  const setHoverIndex = (i: number | null) => {
    setHover(i)
    onScrub?.(i)
  }

  const indexFromClientX = (clientX: number) => {
    const rect = wrapRef.current?.getBoundingClientRect()
    if (!rect) return null
    const rel = clientX - rect.left - PAD.left
    const i = Math.round((rel / innerW) * (safePoints.length - 1))
    return Math.min(Math.max(i, 0), safePoints.length - 1)
  }

  const ticks = [0, maxY / 2, maxY]
  const labelStep = Math.ceil(safePoints.length / Math.max(Math.floor(innerW / 64), 2))

  if (view === 'table') {
    return (
      <div className="max-h-[260px] overflow-y-auto">
        <table className="w-full text-[13px]">
          <thead className="sticky top-0 bg-white text-left text-[11px] text-gray-400">
            <tr>
              <th className="py-2 font-medium">Período</th>
              <th className="py-2 text-right font-medium">Actual</th>
              {showComparison && <th className="py-2 text-right font-medium">Anterior</th>}
            </tr>
          </thead>
          <tbody className="tabular-nums">
            {safePoints.map((p, i) => (
              <tr key={`${p.label}-${i}`} className="border-t border-gray-100">
                <td className="py-2 text-gray-500">{p.label}</td>
                <td className="py-2 text-right font-medium text-gray-900">{formatValue(values[i], metric, hiddenAmounts)}</td>
                {showComparison && (
                  <td className="py-2 text-right text-gray-400">{formatValue(prevValues[i], metric, hiddenAmounts)}</td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  const hp = hover != null ? safePoints[hover] : null
  // El tooltip va al costado de la línea de cruce (no encima del cursor) y se da vuelta cerca del borde.
  const tooltipLeft = hover != null ? (x(hover) + 172 > width ? x(hover) - 172 : x(hover) + 12) : 0

  return (
    <div
      ref={wrapRef}
      className="relative select-none outline-none focus-visible:ring-2 focus-visible:ring-gray-900/10 rounded-lg"
      tabIndex={0}
      role="img"
      aria-label="Gráfico de ventas. Usá las flechas para recorrer los puntos."
      onPointerMove={e => setHoverIndex(indexFromClientX(e.clientX))}
      onPointerLeave={() => setHoverIndex(null)}
      onBlur={() => setHoverIndex(null)}
      onKeyDown={e => {
        if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
        e.preventDefault()
        const cur = hover ?? (e.key === 'ArrowLeft' ? safePoints.length : -1)
        const next = Math.min(Math.max(cur + (e.key === 'ArrowRight' ? 1 : -1), 0), safePoints.length - 1)
        setHoverIndex(next)
      }}
    >
      <style>{`
        @keyframes nb-draw { from { stroke-dashoffset: 1; } to { stroke-dashoffset: 0; } }
        @keyframes nb-fade { from { opacity: 0; } to { opacity: 1; } }
        .nb-draw { stroke-dasharray: 1; animation: nb-draw 900ms cubic-bezier(0.4,0,0.2,1) both; }
        .nb-area { animation: nb-fade 700ms 250ms ease-out both; }
        @media (prefers-reduced-motion: reduce) { .nb-draw, .nb-area { animation: none; } }
      `}</style>
      <svg width={width} height={H} className="block w-full overflow-visible" aria-hidden>
        <defs>
          <linearGradient id="nb-sales-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#111827" stopOpacity="0.09" />
            <stop offset="100%" stopColor="#111827" stopOpacity="0" />
          </linearGradient>
        </defs>

        {ticks.map(t => (
          <g key={t}>
            <line
              x1={PAD.left}
              x2={width - PAD.right}
              y1={y(t)}
              y2={y(t)}
              stroke="#F1F1F3"
              strokeDasharray={t === 0 ? undefined : '3 4'}
            />
            <text x={PAD.left - 10} y={y(t) + 3.5} textAnchor="end" className="fill-gray-400 text-[10px] tabular-nums">
              {hiddenAmounts && metric !== 'orders' ? '•••' : metric === 'orders' ? formatCount(t) : `$${COMPACT.format(t)}`}
            </text>
          </g>
        ))}

        {safePoints.map((p, i) => {
          const last = safePoints.length - 1
          // El último rótulo siempre va; el anterior se salta si quedaría encimado.
          const show = i === last || (i % labelStep === 0 && last - i >= labelStep * 0.6)
          return show ? (
            <text
              key={`${p.label}-${i}`}
              x={x(i)}
              y={H - 6}
              textAnchor={i === 0 ? 'start' : i === safePoints.length - 1 ? 'end' : 'middle'}
              className={`text-[10px] tabular-nums ${hover === i ? 'fill-gray-900' : 'fill-gray-400'}`}
            >
              {p.label}
            </text>
          ) : null
        })}

        {showComparison && (
          <path
            d={linePath(prevValues)}
            fill="none"
            stroke="#C4C4CC"
            strokeWidth={1.5}
            strokeDasharray="4 4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        <path key={`a-${drawKey}`} d={areaPath} fill="url(#nb-sales-area)" className="nb-area" />
        <path
          key={`l-${drawKey}`}
          d={mainPath}
          pathLength={1}
          fill="none"
          stroke="#111827"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="nb-draw"
        />

        {hover != null && (
          <g>
            <line x1={x(hover)} x2={x(hover)} y1={PAD.top} y2={PAD.top + innerH} stroke="#111827" strokeOpacity={0.15} />
            {showComparison && (
              <circle cx={x(hover)} cy={y(prevValues[hover])} r={4} fill="#C4C4CC" stroke="#fff" strokeWidth={2} />
            )}
            <circle cx={x(hover)} cy={y(values[hover])} r={5} fill="#111827" stroke="#fff" strokeWidth={2} />
          </g>
        )}
      </svg>

      {hp && hover != null && (
        <div
          className="pointer-events-none absolute top-0 z-10 w-40 rounded-xl border border-gray-200 bg-white/95 px-3 py-2 text-[12px] shadow-[0_8px_24px_-6px_rgba(16,24,40,0.16)] backdrop-blur"
          style={{ left: tooltipLeft }}
        >
          <p className="mb-1 font-medium text-gray-500">{hp.label}</p>
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 text-gray-500">
              <span className="h-0.5 w-3 rounded-full bg-gray-900" aria-hidden />
              Actual
            </span>
            <span className="font-semibold tabular-nums text-gray-900">{formatValue(values[hover], metric, hiddenAmounts)}</span>
          </div>
          {showComparison && (
            <div className="mt-0.5 flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-gray-400">
                <span className="h-0 w-3 border-t-[1.5px] border-dashed border-gray-400" aria-hidden />
                Anterior
              </span>
              <span className="tabular-nums text-gray-500">{formatValue(prevValues[hover], metric, hiddenAmounts)}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
