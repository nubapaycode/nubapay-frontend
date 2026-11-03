'use client'

import { useEffect, useId, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react'

import { fmtDay, fmtDayLong } from './format'
import { FUNNEL_STEPS, INK, SERIES, SURFACE } from './theme'
import { cx } from './ui'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Máximo "lindo" (1/2/5 × 10^n) y ticks equiespaciados desde 0. */
function niceScale(max: number, ticks = 4): { max: number; values: number[] } {
  if (!isFinite(max) || max <= 0) return { max: 1, values: [0, 1] }
  const rough = max / ticks
  const pow = Math.pow(10, Math.floor(Math.log10(rough)))
  const frac = rough / pow
  const step = (frac <= 1 ? 1 : frac <= 2 ? 2 : frac <= 5 ? 5 : 10) * pow
  const niceMax = Math.ceil(max / step) * step
  const values: number[] = []
  for (let v = 0; v <= niceMax + step / 2; v += step) values.push(v)
  return { max: niceMax, values }
}

function useWidth<T extends HTMLElement>(initial = 640) {
  const ref = useRef<T>(null)
  const [w, setW] = useState(initial)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    setW(el.clientWidth || initial)
    const ro = new ResizeObserver((entries) => {
      const next = Math.round(entries[0].contentRect.width)
      if (next > 0) setW(next)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [initial])
  return [ref, w] as const
}

// ---------------------------------------------------------------------------
// Área / línea con crosshair
// ---------------------------------------------------------------------------

export type SeriesPoint = { date: string; value: number }

export function AreaChart({
  points,
  seriesName,
  format,
  axisFormat,
  color = SERIES.blue,
  height = 260,
  loading,
  drawKey,
}: {
  points: SeriesPoint[]
  seriesName: string
  format: (n: number) => string
  axisFormat: (n: number) => string
  color?: string
  height?: number
  /** Mientras recarga conserva el último render con opacidad reducida (sin saltos). */
  loading?: boolean
  /** Al cambiar (otra métrica o período) la línea se vuelve a dibujar. */
  drawKey?: string
}) {
  const [ref, width] = useWidth<HTMLDivElement>()
  const [hover, setHover] = useState<number | null>(null)
  const gid = useId().replace(/:/g, '')

  const m = { top: 14, right: 18, bottom: 28, left: 64 }
  const innerW = Math.max(40, width - m.left - m.right)
  const innerH = height - m.top - m.bottom
  const n = points.length

  const scale = useMemo(() => niceScale(Math.max(0, ...points.map((p) => p.value))), [points])
  const x = (i: number) => m.left + (n <= 1 ? innerW / 2 : (i / (n - 1)) * innerW)
  const y = (v: number) => m.top + innerH - (v / scale.max) * innerH

  const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(' ')
  const area = n
    ? `${line} L${x(n - 1).toFixed(1)},${(m.top + innerH).toFixed(1)} L${x(0).toFixed(1)},${(m.top + innerH).toFixed(1)} Z`
    : ''

  // ~6 etiquetas en X, siempre incluyendo primera y última.
  const xTickIdx = useMemo(() => {
    if (n <= 1) return [0]
    const target = Math.max(2, Math.min(7, Math.floor(innerW / 90)))
    const set = new Set<number>()
    for (let k = 0; k < target; k++) set.add(Math.round((k / (target - 1)) * (n - 1)))
    return [...set]
  }, [n, innerW])

  function onMove(clientX: number, rect: DOMRect) {
    if (!n) return
    const rel = clientX - rect.left - m.left
    const idx = n <= 1 ? 0 : Math.round((rel / innerW) * (n - 1))
    setHover(Math.max(0, Math.min(n - 1, idx)))
  }

  const active = hover !== null ? points[hover] : null
  const tipLeft = hover !== null ? x(hover) : 0
  const flip = tipLeft > width * 0.62

  return (
    <div ref={ref} className={cx('relative transition-opacity', loading && 'opacity-60')}>
      <svg
        width={width}
        height={height}
        role="img"
        tabIndex={0}
        aria-label={`${seriesName} por día. Usá las flechas para recorrer los valores.`}
        onPointerMove={(e) => onMove(e.clientX, e.currentTarget.getBoundingClientRect())}
        onPointerLeave={() => setHover(null)}
        onBlur={() => setHover(null)}
        onFocus={() => setHover((h) => h ?? n - 1)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowLeft') setHover((h) => Math.max(0, (h ?? n) - 1))
          else if (e.key === 'ArrowRight') setHover((h) => Math.min(n - 1, (h ?? -1) + 1))
          else if (e.key === 'Escape') setHover(null)
        }}
        className="block touch-pan-y select-none outline-none focus-visible:rounded-md focus-visible:ring-2 focus-visible:ring-admin-accent/50"
      >
        <defs>
          <linearGradient id={`g${gid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={color} stopOpacity="0.2" />
            <stop offset="1" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>

        {scale.values.map((v) => (
          <g key={v}>
            <line x1={m.left} x2={width - m.right} y1={y(v)} y2={y(v)} stroke={v === 0 ? INK.axis : INK.grid} strokeWidth={1} />
            <text x={m.left - 8} y={y(v)} dy="0.32em" textAnchor="end" fontSize={10.5} fill={INK.muted} className="font-admin-mono">
              {axisFormat(v)}
            </text>
          </g>
        ))}

        {xTickIdx.map((i) => (
          <text
            key={i}
            x={x(i)}
            y={height - 8}
            textAnchor={i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle'}
            fontSize={10.5}
            fill={INK.muted}
            className="font-admin-mono"
          >
            {fmtDay(points[i].date)}
          </text>
        ))}

        {n > 0 && <path key={`a${drawKey}`} className="admin-area" d={area} fill={`url(#g${gid})`} />}
        {n > 0 && (
          <path
            key={`l${drawKey}`}
            className="admin-draw"
            pathLength={1}
            d={line}
            fill="none"
            stroke={color}
            strokeWidth={1.75}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        )}

        {n > 0 && hover === null && (
          <circle cx={x(n - 1)} cy={y(points[n - 1].value)} r={4} fill={color} stroke={SURFACE} strokeWidth={2} />
        )}

        {active && hover !== null && (
          <g pointerEvents="none">
            <line x1={x(hover)} x2={x(hover)} y1={m.top} y2={m.top + innerH} stroke={INK.secondary} strokeOpacity={0.45} strokeWidth={1} />
            <circle cx={x(hover)} cy={y(active.value)} r={4.5} fill={color} stroke={SURFACE} strokeWidth={2} />
          </g>
        )}
      </svg>

      {active && hover !== null && (
        <div
          className="pointer-events-none absolute top-2 z-10 min-w-[128px] rounded-md border border-white/10 bg-admin-raised/95 px-3 py-2 shadow-xl backdrop-blur"
          style={flip ? { right: width - tipLeft + 12 } : { left: tipLeft + 12 }}
        >
          <p className="text-[11px] text-white/50">{fmtDayLong(active.date)}</p>
          <p className="mt-0.5 flex items-center gap-2 text-sm">
            <span className="inline-block h-0.5 w-3 rounded" style={{ background: color }} />
            <span className="font-semibold text-white">{format(active.value)}</span>
          </p>
          <p className="text-[11px] text-white/60">{seriesName}</p>
        </div>
      )}
    </div>
  )
}

/** Vista de tabla equivalente al gráfico (los valores nunca dependen del hover). */
export function SeriesTable({ points, format, label }: { points: SeriesPoint[]; format: (n: number) => string; label: string }) {
  return (
    <div className="max-h-[260px] overflow-auto rounded-md border border-white/[0.06]">
      <table className="w-full text-left text-sm">
        <thead className="sticky top-0 bg-admin-raised">
          <tr>
            <th className="px-3 py-2 text-xs font-medium text-white/50">Día</th>
            <th className="px-3 py-2 text-right text-xs font-medium text-white/50">{label}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/[0.04]">
          {[...points].reverse().map((p) => (
            <tr key={p.date}>
              <td className="px-3 py-1.5 text-white/60">{fmtDayLong(p.date)}</td>
              <td className="px-3 py-1.5 text-right tabular-nums text-white/90">{format(p.value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Latido: una barra por revisión de salud
// ---------------------------------------------------------------------------

export type Beat = { at: string; ok: boolean; ms: number | null }

/** Últimas revisiones hechas desde este navegador; los huecos marcan lo que todavía no se midió. */
export function Heartbeat({ beats, slots = 30, unit = 'ms' }: { beats: Beat[]; slots?: number; unit?: string }) {
  const recent = beats.slice(-slots)
  const max = Math.max(...recent.map((b) => b.ms ?? 0), 1)
  return (
    <div className="flex h-6 items-end gap-[2px]" aria-hidden>
      {Array.from({ length: slots - recent.length }).map((_, i) => (
        <span key={`e${i}`} className="h-1 flex-1 rounded-[1px] bg-white/[0.06]" />
      ))}
      {recent.map((b) => (
        <span
          key={b.at}
          title={b.ms === null ? 'Sin medición' : `${b.ms} ${unit}`}
          className={cx('admin-fade flex-1 rounded-[1px]', b.ok ? 'bg-emerald-400/70' : 'bg-red-400')}
          style={{ height: b.ok && b.ms !== null ? `${Math.max(25, (b.ms / max) * 100)}%` : '100%' }}
        />
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Barras horizontales (ranking / medios de pago)
// ---------------------------------------------------------------------------

export type BarRow = { key: string; label: string; value: number; color?: string; sub?: ReactNode }

export function BarList({
  rows,
  format,
  color = SERIES.blue,
  emptyLabel = 'Sin datos en el período',
}: {
  rows: BarRow[]
  format: (n: number) => string
  color?: string
  emptyLabel?: string
}) {
  const max = Math.max(...rows.map((r) => r.value), 0)
  if (!rows.length || max <= 0) return <p className="py-6 text-center text-sm text-white/55">{emptyLabel}</p>
  return (
    <ul className="space-y-3">
      {rows.map((r, i) => {
        const pct = Math.max(2, (r.value / max) * 100)
        return (
          <li key={r.key} className="group" title={`${r.label}: ${format(r.value)}`}>
            <div className="flex items-baseline justify-between gap-3">
              <span className="flex min-w-0 items-center gap-2 text-sm text-white/80">
                <span className="inline-block h-2.5 w-2.5 flex-shrink-0 rounded-[3px]" style={{ background: r.color ?? color }} />
                <span className="truncate">{r.label}</span>
              </span>
              <span className="flex-shrink-0 font-admin-mono text-[13px] tabular-nums text-white">{format(r.value)}</span>
            </div>
            <div className="mt-1.5 h-1 rounded-full bg-white/[0.06]">
              <div
                className="admin-grow h-full rounded-full transition-[width,filter] duration-300 group-hover:brightness-125"
                style={{ width: `${pct}%`, background: r.color ?? color, '--i': i } as CSSProperties}
              />
            </div>
            {r.sub && <p className="mt-1 text-[11px] text-white/55">{r.sub}</p>}
          </li>
        )
      })}
    </ul>
  )
}

// ---------------------------------------------------------------------------
// Embudo
// ---------------------------------------------------------------------------

export type FunnelStep = { key: string; label: string; value: number }

export function Funnel({ steps }: { steps: FunnelStep[] }) {
  const top = Math.max(steps[0]?.value ?? 0, 1)
  return (
    <ol className="space-y-2.5">
      {steps.map((s, i) => {
        const prev = i === 0 ? null : steps[i - 1].value
        const rate = prev ? Math.round((s.value / prev) * 100) : null
        const pct = Math.max(s.value > 0 ? 3 : 0, (s.value / top) * 100)
        return (
          <li key={s.key}>
            <div className="mb-1 flex items-baseline justify-between text-sm">
              <span className="text-white/75">{s.label}</span>
              <span className="tabular-nums">
                <span className="font-admin-mono text-[13px] text-white">{s.value.toLocaleString('es-AR')}</span>
                {rate !== null && <span className="ml-2 text-xs text-white/55">{rate}% del paso anterior</span>}
              </span>
            </div>
            <div className="h-2 rounded-full bg-white/[0.06]">
              <div
                className="admin-grow h-full rounded-full transition-[width] duration-300"
                style={{ width: `${pct}%`, background: FUNNEL_STEPS[Math.min(i, FUNNEL_STEPS.length - 1)], '--i': i } as CSSProperties}
              />
            </div>
          </li>
        )
      })}
    </ol>
  )
}
