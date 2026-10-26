'use client'

import { ArrowUpRight, X } from 'lucide-react'
import { useState } from 'react'

import { cn } from '@/lib/utils'
import type { DashboardPaymentKey, DashboardSummary } from '@/lib/organizerWorkspace'
import type { OrderStatus } from '@/types'

import { Money, formatCount } from './AnimatedNumber'

/**
 * Colores categóricos validados para daltonismo (slots 1–3 de la paleta de referencia):
 * cada método conserva su color aunque se filtre.
 */
export const PAYMENT_CONFIG: { key: DashboardPaymentKey; label: string; color: string }[] = [
  { key: 'mp', label: 'Mercado Pago', color: '#2a78d6' },
  { key: 'cash', label: 'Efectivo', color: '#eb6834' },
  { key: 'transfer', label: 'Transferencia', color: '#1baf7a' },
]

const STATUS_CONFIG: { key: OrderStatus; label: string; dot: string }[] = [
  { key: 'paid', label: 'Pagados, sin retirar', dot: 'bg-amber-400' },
  { key: 'partially_delivered', label: 'Entrega parcial', dot: 'bg-violet-400' },
  { key: 'delivered', label: 'Finalizados', dot: 'bg-emerald-500' },
  { key: 'cancelled', label: 'Cancelados', dot: 'bg-red-400' },
]

export function Panel({
  title,
  aside,
  className,
  children,
}: {
  title: string
  aside?: React.ReactNode
  className?: string
  children: React.ReactNode
}) {
  return (
    <section
      className={cn(
        'nb-rise h-full rounded-2xl border border-gray-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)]',
        className,
      )}
    >
      <header className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-[13px] font-semibold text-gray-900">{title}</h2>
        {aside}
      </header>
      {children}
    </section>
  )
}

/** Fila de lista con la barra de proporción detrás del contenido (patrón de Dub / Plausible). */
function BarRow({
  pct,
  color,
  active,
  dimmed,
  onClick,
  title,
  children,
}: {
  pct: number
  color: string
  active?: boolean
  dimmed?: boolean
  onClick?: () => void
  title?: string
  children: React.ReactNode
}) {
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      title={title}
      aria-pressed={onClick ? active : undefined}
      className={cn(
        'group relative flex w-full items-center gap-3 overflow-hidden rounded-lg px-2.5 py-2 text-left transition-[opacity,background-color] duration-200',
        onClick && 'hover:bg-gray-50',
        active && 'ring-1 ring-gray-900/80',
        dimmed && 'opacity-45 hover:opacity-100',
      )}
    >
      <span
        aria-hidden
        className="nb-bar absolute inset-y-0.5 left-0 rounded-md"
        style={{ width: `${Math.max(pct, 0.5)}%`, backgroundColor: color }}
      />
      <span className="relative z-[1] flex min-w-0 flex-1 items-center gap-3">{children}</span>
    </Tag>
  )
}

export function PaymentMethodsPanel({
  summary,
  hidden,
  selected,
  onSelect,
}: {
  summary: DashboardSummary
  hidden: boolean
  selected: DashboardPaymentKey | null
  onSelect: (k: DashboardPaymentKey | null) => void
}) {
  const rows = PAYMENT_CONFIG.map(cfg => ({
    ...cfg,
    ...(summary.payment_breakdown?.find(p => p.key === cfg.key) ?? { count: 0, revenue: 0 }),
  }))
  const total = rows.reduce((a, r) => a + r.revenue, 0)

  return (
    <Panel title="Métodos de pago" aside={<span className="text-[11px] text-gray-400">Tocá uno para filtrar</span>}>
      {/* Barra segmentada: una sola lectura de la proporción (Tremor). 2px de separación entre tramos. */}
      <div className="mb-4 flex h-2.5 w-full gap-[2px] overflow-hidden rounded-full bg-gray-100" aria-hidden>
        {total > 0 &&
          rows.map(r =>
            r.revenue > 0 ? (
              <span
                key={r.key}
                className="nb-grow h-full first:rounded-l-full last:rounded-r-full transition-opacity"
                style={{
                  width: `${(r.revenue / total) * 100}%`,
                  backgroundColor: r.color,
                  opacity: selected && selected !== r.key ? 0.25 : 1,
                }}
              />
            ) : null,
          )}
      </div>
      <div className="flex flex-col gap-1">
        {rows.map(r => {
          const pct = total ? (r.revenue / total) * 100 : 0
          return (
            <BarRow
              key={r.key}
              pct={pct}
              color={`${r.color}14`}
              active={selected === r.key}
              dimmed={selected != null && selected !== r.key}
              onClick={() => onSelect(selected === r.key ? null : r.key)}
              title={selected === r.key ? 'Quitar filtro' : `Filtrar por ${r.label}`}
            >
              <span className="size-2.5 shrink-0 rounded-[3px]" style={{ backgroundColor: r.color }} aria-hidden />
              <span className="min-w-0 flex-1 truncate text-[13px] text-gray-700">{r.label}</span>
              <span className="text-[12px] tabular-nums text-gray-400">{formatCount(r.count)} ped.</span>
              <span className="hidden w-10 text-right text-[12px] tabular-nums text-gray-400 sm:inline">{Math.round(pct)}%</span>
              <Money value={r.revenue} hidden={hidden} className="w-24 text-right text-[13px] font-semibold tabular-nums text-gray-900" />
            </BarRow>
          )
        })}
      </div>
    </Panel>
  )
}

const TOP_VISIBLE = 5

export function TopProductsPanel({
  summary,
  hidden,
  selected,
  onSelect,
}: {
  summary: DashboardSummary
  hidden: boolean
  selected: string | null
  onSelect: (name: string | null) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const products = summary.top_products ?? []
  const maxQty = products[0]?.quantity || 1
  const visible = expanded ? products : products.slice(0, TOP_VISIBLE)
  const canExpand = products.length > TOP_VISIBLE

  return (
    <Panel
      title={selected ? 'Se compra junto con…' : 'Más vendidos'}
      aside={<span className="text-[11px] text-gray-400">por unidades</span>}
    >
      {products.length === 0 ? (
        <div className="flex flex-col items-center py-8 text-center">
          <div className="mb-3 flex size-10 items-center justify-center rounded-2xl bg-gray-50">
            <ArrowUpRight size={18} strokeWidth={1.5} className="text-gray-400" aria-hidden />
          </div>
          <p className="text-sm font-medium text-gray-900">Sin ventas aún</p>
          <p className="mt-1 text-xs text-gray-400">Los más vendidos aparecerán acá</p>
        </div>
      ) : (
        <div className="relative">
          <ol className="flex flex-col gap-1">
            {visible.map((p, i) => (
              <li key={p.name}>
                <BarRow
                  pct={(p.quantity / maxQty) * 100}
                  color="#11182709"
                  active={selected === p.name}
                  onClick={() => onSelect(selected === p.name ? null : p.name)}
                  title={selected === p.name ? 'Quitar filtro' : `Filtrar por ${p.name}`}
                >
                  <span className="w-4 shrink-0 text-[11px] font-semibold tabular-nums text-gray-300">{i + 1}</span>
                  <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-gray-800">{p.name}</span>
                  <span className="text-[12px] tabular-nums text-gray-400">{formatCount(p.quantity)} u.</span>
                  <Money value={p.revenue} hidden={hidden} className="w-24 text-right text-[13px] font-semibold tabular-nums text-gray-900" />
                </BarRow>
              </li>
            ))}
          </ol>
          {canExpand && !expanded && (
            <div className="pointer-events-none absolute inset-x-0 bottom-0 flex h-16 items-end justify-center bg-gradient-to-t from-white via-white/85 to-transparent">
              <button
                type="button"
                onClick={() => setExpanded(true)}
                className="pointer-events-auto rounded-full border border-gray-200 bg-white px-3 py-1 text-[12px] font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
              >
                Ver los {products.length}
              </button>
            </div>
          )}
        </div>
      )}
    </Panel>
  )
}

export function StatusPanel({ summary }: { summary: DashboardSummary }) {
  const total = summary.order_count || 0
  return (
    <Panel title="Estado de los pedidos" aside={<span className="text-[11px] tabular-nums text-gray-400">{formatCount(total)} en total</span>}>
      <ul className="flex flex-col gap-3">
        {STATUS_CONFIG.map(s => {
          const count = summary.by_status?.[s.key] ?? 0
          const pct = total ? (count / total) * 100 : 0
          return (
            <li key={s.key}>
              <div className="mb-1.5 flex items-center gap-2">
                <span className={`size-2 shrink-0 rounded-full ${s.dot}`} aria-hidden />
                <span className="flex-1 text-[13px] text-gray-600">{s.label}</span>
                <span className="text-[13px] font-semibold tabular-nums text-gray-900">{formatCount(count)}</span>
                <span className="w-9 text-right text-[11px] tabular-nums text-gray-400">{Math.round(pct)}%</span>
              </div>
              <div className="ml-4 h-1 overflow-hidden rounded-full bg-gray-100">
                <div className={`nb-grow h-full rounded-full ${s.dot}`} style={{ width: `${pct}%` }} />
              </div>
            </li>
          )
        })}
      </ul>
    </Panel>
  )
}

/** Ritmo de los últimos 30 minutos: una barra por minuto, el último resaltado (Aqtos / Plausible). */
export function LivePanel({ summary, hidden }: { summary: DashboardSummary; hidden: boolean }) {
  const live = summary.live
  const perMinute = live?.per_minute ?? []
  const max = Math.max(...perMinute, 1)
  const last10 = perMinute.slice(-10).reduce((a, b) => a + b, 0)

  return (
    <Panel
      title="Ritmo en vivo"
      aside={
        <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-700">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-60 motion-reduce:animate-none" />
            <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
          </span>
          En vivo
        </span>
      }
    >
      <div className="mb-4 grid grid-cols-2 gap-3">
        <div>
          <p className="text-[11px] text-gray-400">Última hora</p>
          <p className="text-lg font-semibold tabular-nums text-gray-900">{formatCount(live?.orders_last_hour ?? 0)} <span className="text-[13px] font-normal text-gray-400">pedidos</span></p>
        </div>
        <div>
          <p className="text-[11px] text-gray-400">Recaudado última hora</p>
          <Money value={live?.revenue_last_hour ?? 0} hidden={hidden} className="text-lg font-semibold tabular-nums text-gray-900" />
        </div>
      </div>
      <div className="flex h-14 items-end gap-[3px]" role="img" aria-label={`${last10} pedidos en los últimos 10 minutos`}>
        {(perMinute.length ? perMinute : Array.from({ length: 30 }, () => 0)).map((n, i, arr) => (
          <span
            key={i}
            title={`${n} pedido${n === 1 ? '' : 's'} hace ${arr.length - 1 - i} min`}
            className={cn('flex-1 rounded-[2px] transition-[height] duration-500', i === arr.length - 1 ? 'bg-gray-900' : n ? 'bg-gray-300' : 'bg-gray-100')}
            style={{ height: `${Math.max((n / max) * 100, 6)}%` }}
          />
        ))}
      </div>
      <div className="mt-1.5 flex justify-between text-[10px] text-gray-400">
        <span>hace 30 min</span>
        <span>ahora</span>
      </div>
    </Panel>
  )
}

export function FilterChip({ label, value, onClear }: { label: string; value: string; onClear: () => void }) {
  return (
    <span className="nb-pop inline-flex h-9 items-center gap-1 rounded-xl border border-gray-200 bg-white pl-3 pr-1 text-[13px] shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
      <span className="text-gray-400">{label}</span>
      <span className="max-w-[160px] truncate font-medium text-gray-900">{value}</span>
      <button
        type="button"
        onClick={onClear}
        aria-label={`Quitar filtro ${label} ${value}`}
        className="ml-0.5 rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-900"
      >
        <X size={13} strokeWidth={2} aria-hidden />
      </button>
    </span>
  )
}
